import { useState, useRef, useEffect, useCallback } from 'react';
import { authenticatedFetch } from '../services/firebaseAuthService';

interface UsePushToTalkOptions {
  onTranscriptComplete?: (transcript: string) => void;
  autoSend?: boolean;
}

export function usePushToTalk({ onTranscriptComplete, autoSend = false }: UsePushToTalkOptions = {}) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const interimTranscriptRef = useRef<string>('');

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioDuration(0);
    setAudioVolume(0);
    audioChunksRef.current = [];
    interimTranscriptRef.current = '';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('MediaDevices API not supported on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setPermissionDenied(false);

      // Setup audio analyzer for live waveform metering
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (e) {
        // AudioContext may be restricted by autoplay policy; non-critical
      }

      // Check supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Also initialize browser SpeechRecognition as an immediate parallel transcript fallback
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          recognition.onresult = (event: any) => {
            let finalStr = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript;
              } else {
                interimTranscriptRef.current = event.results[i][0].transcript;
              }
            }
            if (finalStr) {
              interimTranscriptRef.current = finalStr;
            }
          };
          recognition.onerror = () => {};
          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          // Non-critical if SpeechRecognition is unavailable
        }
      }

      recorder.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setAudioDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Microphone permission was denied. Please allow microphone access in your browser.');
      } else {
        setError(err.message || 'Could not initialize audio capture.');
      }
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string> => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }

    setIsRecording(false);
    setIsTranscribing(true);

    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;

      const finishAndTranscribe = async () => {
        // Stop audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const mime = recorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });

        try {
          // If we received an immediate SpeechRecognition interim transcript, hold it
          const localTranscript = interimTranscriptRef.current.trim();

          // Convert audio blob to base64
          const base64Audio = await blobToBase64(audioBlob);

          // Send to speech-to-text service
          const response = await authenticatedFetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: mime,
            }),
          });

          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : {};
          if (!response.ok) {
            throw new Error(data.error || 'Speech transcription failed.');
          }
          const transcriptText = typeof data.text === 'string' ? data.text.trim() : '';
          const finalResult = transcriptText || localTranscript;
          if (!finalResult) {
            throw new Error('No speech was detected. Try again or type your prompt.');
          }

          setIsTranscribing(false);
          if (onTranscriptComplete) {
            onTranscriptComplete(finalResult);
          }
          resolve(finalResult);
        } catch (err: any) {
          const localTranscript = interimTranscriptRef.current.trim();
          setIsTranscribing(false);
          if (localTranscript) {
            onTranscriptComplete?.(localTranscript);
            resolve(localTranscript);
            return;
          }
          setError(err instanceof Error ? err.message : 'Speech transcription failed.');
          resolve('');
        }
      };

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = finishAndTranscribe;
        recorder.stop();
      } else {
        finishAndTranscribe();
      }
    });
  }, [onTranscriptComplete]);

  const cancelRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setIsTranscribing(false);
    setAudioDuration(0);
    setAudioVolume(0);
  }, []);

  return {
    isRecording,
    isTranscribing,
    audioDuration,
    audioVolume,
    error,
    permissionDenied,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

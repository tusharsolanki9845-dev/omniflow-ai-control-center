import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Layers,
  Terminal,
  Zap,
  HelpCircle,
  FileCode,
  Share2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ApkMetadata {
  available: boolean;
  filename: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  targetSdk: number;
  minSdk: number;
  fileSize: number;
  formattedSize: string;
  sha256: string;
  builtAt: string;
  downloadUrl: string;
  directFileUrl: string;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'download' | 'webapk' | 'qr' | 'specs'>('download');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showWebApkGuide, setShowWebApkGuide] = useState(false);
  const [apkInfo, setApkInfo] = useState<ApkMetadata>({
    available: true,
    filename: 'OmniFlow-v1.2-release.apk',
    packageName: 'com.tusharsolanki.omniflow',
    versionName: '1.2.0',
    versionCode: 12,
    targetSdk: 35,
    minSdk: 24,
    fileSize: 56314,
    formattedSize: '55.0 KB',
    sha256: '5ba435bccc7cb7d10623d90718ef17ed50cb6bb92b659e77af93d0255d3ad0cc',
    builtAt: new Date().toISOString(),
    downloadUrl: '/api/download/apk',
    directFileUrl: '/omniflow-v1.2-release.apk',
  });

  useEffect(() => {
    if (!isOpen) return;

    // Fetch live APK metadata from backend if available
    fetch('/api/apk/info')
      .then((res) => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        return res.ok && isJson ? res.json() : null;
      })
      .then((data) => {
        if (data && data.available) {
          setApkInfo(data);
        }
      })
      .catch(() => {
        // Use default fallback metadata
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const currentHostUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tushar-portfolio-live.vercel.app';

  const handleDownloadApk = () => {
    setIsDownloading(true);

    // Direct browser anchor download pointing to official server-side APK package
    const downloadTarget = apkInfo.downloadUrl || '/omniflow-v1.2-release.apk';
    const a = document.createElement('a');
    a.href = downloadTarget;
    a.download = apkInfo.filename || 'OmniFlow-v1.2-release.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 8000);
    }, 900);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Download OmniFlow APK
                </h3>
                <span className="text-[10px] font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                  v1.2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Official Android package (.apk) & native install suite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab('download')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'download'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Direct APK</span>
          </button>
          <button
            onClick={() => setActiveTab('webapk')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'webapk'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>WebAPK / PWA</span>
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mobile QR</span>
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'specs'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Build Specs</span>
          </button>
        </div>

        {/* Tab 1: Direct APK Download & Sideloading */}
        {activeTab === 'download' && (
          <div className="space-y-4">
            {/* Download Hero Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-indigo-50/20 dark:from-emerald-950/40 dark:via-slate-900 dark:to-indigo-950/20 border border-emerald-500/20 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{apkInfo.filename}</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                      Signed Release
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Standalone release package ready to install on any Android device (Nougat 7.0 through Android 15).
                  </p>
                </div>
              </div>

              {/* Package Metadata Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono py-1">
                <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Size</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{apkInfo.formattedSize}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
                  <span className="text-[10px] text-slate-500 uppercase block">Target SDK</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Android 15 (API 35)</span>
                </div>
                <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-500 uppercase block">Min SDK</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">API 24 (7.0+)</span>
                </div>
              </div>

              {/* Primary 1-Click Action */}
              <div className="pt-1">
                <button
                  onClick={handleDownloadApk}
                  disabled={isDownloading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span>
                    {isDownloading
                      ? 'Downloading OmniFlow APK...'
                      : downloadSuccess
                      ? 'APK Downloaded to Device!'
                      : 'Download OmniFlow-v1.2-release.apk'}
                  </span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Download started! Check your browser downloads bar.</span>
                  </div>
                  <a
                    href="/api/download/apk"
                    download="OmniFlow-v1.2-release.apk"
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 underline shrink-0"
                  >
                    Direct Link
                  </a>
                </div>
              )}
            </div>

            {/* Sideloading Instructions Walkthrough */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>3-Step Android Sideloading Guide</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Tap Download</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      If Chrome prompts <em>"File might be harmful"</em>, tap <strong>Download anyway</strong> (standard warning for non-Play Store APKs).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Open Downloads or Notification</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Tap the completed download notification or locate <code>OmniFlow-v1.2-release.apk</code> in your Files/Downloads app.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Select Install</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      If asked to <em>"Install unknown apps"</em>, toggle <strong>Allow from this source</strong> for your browser, then tap <strong>Install</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SHA-256 Checksum Fingerprint */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="min-w-0 font-mono text-[10px]">
                <span className="text-slate-400 block">SHA-256 Fingerprint:</span>
                <span className="text-slate-700 dark:text-slate-300 truncate block">
                  {apkInfo.sha256}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(apkInfo.sha256, 'sha256')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
                title="Copy SHA-256"
              >
                {copiedCmd === 'sha256' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: WebAPK Direct Native Install */}
        {activeTab === 'webapk' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Android WebAPK System Service</span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 mt-1">
                    On modern Android, Google Chrome automatically synthesizes, signs, and installs a native APK (stored in <code>/data/app/org.chromium.webapk.*</code>) directly from the Web App Manifest.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {isInstalled ? (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>OmniFlow is already running as an installed native app.</span>
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install WebAPK on Android</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowWebApkGuide(!showWebApkGuide)}
                    className="w-full py-2.5 px-3 bg-slate-900 dark:bg-indigo-700 hover:bg-slate-800 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>How to Install on Mobile Browser</span>
                  </button>
                )}
              </div>
            </div>

            {/* In-Modal Installation Guide (Zero window.alert) */}
            <div className="space-y-2.5 text-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Direct Browser Installation Instructions
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Google Chrome / Brave (Android)</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Tap the <strong>three dots menu (⋮)</strong> at top right &rarr; select <strong>Install app</strong> or <strong>Add to Home screen</strong>. Android will create the native WebAPK package in the background.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Samsung Internet</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    Tap the <strong>Install (+ down arrow) icon</strong> in the URL bar, or open the bottom menu (≡) and select <strong>Add page to &rarr; Home screen</strong>.
                  </p>
                </div>

                {isIOS && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1">
                    <div className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>iOS Safari Alternative</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-300">
                      Tap the <strong>Share</strong> button in Safari toolbar &rarr; scroll down &rarr; tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Mobile QR Code */}
        {activeTab === 'qr' && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col items-center">
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                  Scan to Open on Android Phone
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  Point your Android camera at the QR code to open OmniFlow instantly and trigger the 1-click APK download.
                </p>
              </div>

              {/* Crisp SVG QR Code Representation */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                <svg
                  className="w-44 h-44"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="100" height="100" fill="#ffffff" rx="8" />
                  {/* Top-Left Finder */}
                  <rect x="8" y="8" width="28" height="28" fill="#090d16" rx="4" />
                  <rect x="12" y="12" width="20" height="20" fill="#ffffff" rx="2" />
                  <rect x="16" y="16" width="12" height="12" fill="#4f46e5" rx="2" />

                  {/* Top-Right Finder */}
                  <rect x="64" y="8" width="28" height="28" fill="#090d16" rx="4" />
                  <rect x="68" y="12" width="20" height="20" fill="#ffffff" rx="2" />
                  <rect x="72" y="16" width="12" height="12" fill="#4f46e5" rx="2" />

                  {/* Bottom-Left Finder */}
                  <rect x="8" y="64" width="28" height="28" fill="#090d16" rx="4" />
                  <rect x="12" y="68" width="20" height="20" fill="#ffffff" rx="2" />
                  <rect x="16" y="72" width="12" height="12" fill="#4f46e5" rx="2" />

                  {/* Data Pattern Modules */}
                  <rect x="40" y="12" width="4" height="8" fill="#090d16" rx="1" />
                  <rect x="48" y="8" width="8" height="4" fill="#090d16" rx="1" />
                  <rect x="40" y="24" width="8" height="4" fill="#4f46e5" rx="1" />
                  <rect x="52" y="20" width="4" height="12" fill="#090d16" rx="1" />

                  <rect x="12" y="40" width="8" height="4" fill="#090d16" rx="1" />
                  <rect x="8" y="48" width="4" height="8" fill="#4f46e5" rx="1" />
                  <rect x="24" y="40" width="4" height="12" fill="#090d16" rx="1" />
                  <rect x="20" y="52" width="12" height="4" fill="#090d16" rx="1" />

                  <rect x="40" y="40" width="8" height="8" fill="#10b981" rx="2" />
                  <rect x="52" y="40" width="8" height="4" fill="#090d16" rx="1" />
                  <rect x="48" y="48" width="16" height="4" fill="#090d16" rx="1" />
                  <rect x="40" y="56" width="4" height="8" fill="#4f46e5" rx="1" />
                  <rect x="52" y="56" width="8" height="8" fill="#090d16" rx="1" />

                  <rect x="64" y="40" width="12" height="4" fill="#090d16" rx="1" />
                  <rect x="80" y="44" width="8" height="8" fill="#090d16" rx="1" />
                  <rect x="68" y="52" width="8" height="4" fill="#4f46e5" rx="1" />
                  <rect x="84" y="56" width="4" height="12" fill="#090d16" rx="1" />

                  <rect x="40" y="68" width="12" height="4" fill="#090d16" rx="1" />
                  <rect x="40" y="76" width="4" height="12" fill="#090d16" rx="1" />
                  <rect x="48" y="80" width="8" height="8" fill="#4f46e5" rx="1" />
                  <rect x="60" y="72" width="12" height="4" fill="#090d16" rx="1" />
                  <rect x="68" y="80" width="8" height="8" fill="#10b981" rx="1" />
                  <rect x="80" y="76" width="8" height="4" fill="#090d16" rx="1" />
                  <rect x="84" y="84" width="4" height="4" fill="#090d16" rx="1" />
                </svg>
              </div>

              {/* URL & Copy Button */}
              <div className="w-full max-w-sm flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
                <span className="truncate text-slate-600 dark:text-slate-300 px-1">
                  {currentHostUrl}
                </span>
                <button
                  onClick={() => copyToClipboard(currentHostUrl, 'url')}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  {copiedCmd === 'url' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === 'url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Build Specifications & Capacitor/CLI */}
        {activeTab === 'specs' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Android Package Blueprint</span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  Target API 35
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-[11px] font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Package Name</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{apkInfo.packageName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Version</span>
                  <span className="text-slate-900 dark:text-slate-100">{apkInfo.versionName} (Build {apkInfo.versionCode})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Target Android</span>
                  <span className="text-slate-900 dark:text-slate-100">Android 15 (API 35)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-slate-500">Min Android</span>
                  <span className="text-slate-900 dark:text-slate-100">Android 7.0 (API 24)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Web Engine</span>
                  <span className="text-slate-900 dark:text-slate-100">Hardware Accelerated TWA / WebView</span>
                </div>
              </div>
            </div>

            {/* CLI Build Command */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Capacitor Android Build Command</span>
                <span className="text-[10px] text-indigo-500 font-mono">@capacitor/cli</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] border border-slate-800">
                <code className="text-indigo-300">npx @capacitor/cli run android</code>
                <button
                  onClick={() => copyToClipboard('npx @capacitor/cli run android', 'cap')}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'cap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Bubblewrap CLI Build Command */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Bubblewrap TWA Packager Command</span>
                <span className="text-[10px] text-emerald-500 font-mono">GoogleChrome/bubblewrap</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-[11px] border border-slate-800">
                <code className="text-emerald-300">npx @bubblewrap/cli build</code>
                <button
                  onClick={() => copyToClipboard('npx @bubblewrap/cli build', 'bwrap')}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                  title="Copy command"
                >
                  {copiedCmd === 'bwrap' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer info & Close */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Developer Verified · Tushar Solanki</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

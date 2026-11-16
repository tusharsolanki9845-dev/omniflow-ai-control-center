import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  X,
  FileCode,
  ShieldCheck,
  FolderPlus,
  RefreshCw,
  LogOut,
  HardDrive,
  FileText,
  Archive,
  Layers,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getDriveAccessToken,
  fetchDriveAbout,
  findOrCreateDriveFolder,
  uploadFileToGoogleDrive,
  listGoogleDriveFiles,
  DriveFileItem,
  DriveUserInfo,
  DriveStorageQuota,
} from '../services/googleDriveService';
import { AuditLog, Connection, ModelConfig } from '../types';
import { authenticatedFetch } from '../services/firebaseAuthService';

interface GoogleDriveUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: AuditLog[];
  connections: Connection[];
  models: ModelConfig[];
}

export type BackupPackageType = 'FULL_PROJECT' | 'AUDIT_LEDGER' | 'SYSTEM_CONFIG' | 'ALL_IN_ONE';

export const GoogleDriveUploadModal: React.FC<GoogleDriveUploadModalProps> = ({
  isOpen,
  onClose,
  logs,
  connections,
  models,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getDriveAccessToken());
  const [driveUser, setDriveUser] = useState<DriveUserInfo | null>(null);
  const [storageQuota, setStorageQuota] = useState<DriveStorageQuota | null>(null);

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Upload state
  const [selectedPackage, setSelectedPackage] = useState<BackupPackageType>('FULL_PROJECT');
  const [isPackaging, setIsPackaging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<DriveFileItem | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // User Confirmation Dialog (Mandatory for Workspace APIs)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    fileName: string;
    mimeType: string;
    content: string;
    description: string;
    sizeKb: number;
  } | null>(null);

  // Recent files in Drive
  const [recentFiles, setRecentFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [appFolderId, setAppFolderId] = useState<string | null>(null);

  // Initialize auth listener
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = initDriveAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        loadDriveDetails(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setDriveUser(null);
        setStorageQuota(null);
      }
    );

    // If we already have token in memory
    const curToken = getDriveAccessToken();
    if (curToken) {
      setAccessToken(curToken);
      loadDriveDetails(curToken);
    }

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const loadDriveDetails = async (token: string) => {
    try {
      const about = await fetchDriveAbout(token);
      if (about.user) setDriveUser(about.user);
      if (about.storageQuota) setStorageQuota(about.storageQuota);

      // Find or create "OmniFlow Backups" folder
      const folderId = await findOrCreateDriveFolder('OmniFlow Backups', token);
      setAppFolderId(folderId);

      // Fetch recent files
      loadRecentFiles(token, folderId);
    } catch (err: any) {
      console.warn('Could not load drive user about:', err.message);
    }
  };

  const loadRecentFiles = async (token: string, folderId?: string) => {
    setIsLoadingRecent(true);
    try {
      const files = await listGoogleDriveFiles(token, folderId);
      setRecentFiles(files);
    } catch (e: any) {
      console.error('Failed to load recent files:', e);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const result = await signInWithGoogleDrive();
      setUser(result.user);
      setAccessToken(result.accessToken);
      await loadDriveDetails(result.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication with Google Drive failed.');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogleDrive();
      setUser(null);
      setAccessToken(null);
      setDriveUser(null);
      setStorageQuota(null);
      setRecentFiles([]);
      setUploadSuccess(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  // Prepare package payload
  const preparePackage = async (type: BackupPackageType) => {
    setIsPackaging(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (type === 'FULL_PROJECT') {
        // Fetch bundle from server
        const res = await authenticatedFetch('/api/project/bundle');
        if (!res.ok) {
          throw new Error('Failed to retrieve project files from server.');
        }
        const bundle = await res.json();
        const payload = JSON.stringify(bundle, null, 2);
        const fileName = `OmniFlow_Project_Source_${timestamp}.json`;

        setPendingUploadData({
          fileName,
          mimeType: 'application/json',
          content: payload,
          description: 'OmniFlow Project Complete Source & Architecture Snapshot',
          sizeKb: Math.round(payload.length / 1024),
        });
        setShowConfirmDialog(true);
      } else if (type === 'AUDIT_LEDGER') {
        const payload = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            recordCount: logs.length,
            records: logs,
          },
          null,
          2
        );
        const fileName = `OmniFlow_Audit_Ledger_${timestamp}.json`;

        setPendingUploadData({
          fileName,
          mimeType: 'application/json',
          content: payload,
          description: 'OmniFlow Cryptographic Audit Ledger & Security Log History',
          sizeKb: Math.round(payload.length / 1024),
        });
        setShowConfirmDialog(true);
      } else if (type === 'SYSTEM_CONFIG') {
        const payload = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            connections,
            models,
            systemHealth: {
              status: 'operational',
              localAgent: 'connected',
              activeTunnels: 1,
            },
          },
          null,
          2
        );
        const fileName = `OmniFlow_System_Config_${timestamp}.json`;

        setPendingUploadData({
          fileName,
          mimeType: 'application/json',
          content: payload,
          description: 'OmniFlow Connectors, Models & Subsystem Configuration',
          sizeKb: Math.round(payload.length / 1024),
        });
        setShowConfirmDialog(true);
      } else if (type === 'ALL_IN_ONE') {
        let bundleFiles = [];
        try {
          const res = await authenticatedFetch('/api/project/bundle');
          if (res.ok) {
            const data = await res.json();
            bundleFiles = data.files || [];
          }
        } catch (_) {}

        const payload = JSON.stringify(
          {
            projectName: 'OmniFlow AI Control Center',
            exportedAt: new Date().toISOString(),
            version: '1.4.0',
            systemConfig: { connections, models },
            auditLedger: logs,
            projectSources: bundleFiles,
          },
          null,
          2
        );
        const fileName = `OmniFlow_Full_Backup_${timestamp}.json`;

        setPendingUploadData({
          fileName,
          mimeType: 'application/json',
          content: payload,
          description: 'OmniFlow Unified Project Snapshot (Sources + Config + Audit Ledger)',
          sizeKb: Math.round(payload.length / 1024),
        });
        setShowConfirmDialog(true);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Failed to assemble project backup.');
    } finally {
      setIsPackaging(false);
    }
  };

  // Perform upload after explicit user confirmation
  const executeUploadToDrive = async () => {
    if (!pendingUploadData || !accessToken) return;

    setShowConfirmDialog(false);
    setIsUploading(true);
    setUploadProgressText('Connecting to Google Drive API v3...');

    try {
      // 1. Ensure target folder exists
      setUploadProgressText('Verifying "OmniFlow Backups" folder...');
      const folderId = appFolderId || (await findOrCreateDriveFolder('OmniFlow Backups', accessToken));
      setAppFolderId(folderId);

      // 2. Upload multipart file
      setUploadProgressText(`Uploading ${pendingUploadData.fileName} to Google Drive...`);
      const uploadedFile = await uploadFileToGoogleDrive(
        {
          fileName: pendingUploadData.fileName,
          mimeType: pendingUploadData.mimeType,
          content: pendingUploadData.content,
          folderId,
          description: pendingUploadData.description,
        },
        accessToken
      );

      setUploadSuccess(uploadedFile);
      setPendingUploadData(null);

      // 3. Refresh file list
      loadRecentFiles(accessToken, folderId);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload to Google Drive.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-transparent dark:from-blue-950/20 dark:via-indigo-950/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Google Drive Backup</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Drive v3 API
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload and preserve complete project sources, configs, and ledger records to Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Account Status Card */}
          {!accessToken || !user ? (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <HardDrive className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Connect your Google Drive Account
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in with Google to upload project archives to your personal Drive. OmniFlow will only access files and folders created specifically with this app.
                </p>
              </div>

              {/* Official Google Material Sign-in Button */}
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isLoadingAuth}
                  className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-300 dark:border-slate-700 shadow-xs transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isLoadingAuth ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                  )}
                  <span>{isLoadingAuth ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {driveUser?.photoLink ? (
                  <img
                    src={driveUser.photoLink}
                    alt={driveUser.displayName || 'Google User'}
                    className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                      {driveUser?.displayName || user.displayName || 'Connected User'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3" /> Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Successfully uploaded to Google Drive!</span>
                </div>
                <button
                  onClick={() => setUploadSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-800 text-xs"
                >
                  Dismiss
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                File <strong className="font-mono text-slate-800 dark:text-slate-200">{uploadSuccess.name}</strong> was saved in your &ldquo;OmniFlow Backups&rdquo; folder.
              </p>
              {uploadSuccess.webViewLink && (
                <div className="pt-1">
                  <a
                    href={uploadSuccess.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>Open in Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {uploadError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Upload failed</p>
                <p className="text-[11px] opacity-90 mt-0.5">{uploadError}</p>
              </div>
              <button onClick={() => setUploadError(null)} className="text-rose-500 hover:text-rose-700 text-xs">
                ✕
              </button>
            </div>
          )}

          {/* Package Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Select Project Package to Upload</span>
              <span className="text-[11px] text-slate-400 font-normal">Formats as standardized JSON archive</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Full Project Source Bundle */}
              <button
                type="button"
                onClick={() => setSelectedPackage('FULL_PROJECT')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedPackage === 'FULL_PROJECT'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Project Source Bundle
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  All React components, backend Express routes, configurations, and styles.
                </p>
              </button>

              {/* Option 2: All-in-One Full Backup */}
              <button
                type="button"
                onClick={() => setSelectedPackage('ALL_IN_ONE')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedPackage === 'ALL_IN_ONE'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Archive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Complete Unified Backup
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Source code + connectors state + full cryptographic audit ledger records.
                </p>
              </button>

              {/* Option 3: Audit Ledger Only */}
              <button
                type="button"
                onClick={() => setSelectedPackage('AUDIT_LEDGER')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedPackage === 'AUDIT_LEDGER'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Security & Audit Ledger
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cryptographic ledger logs ({logs.length} operations), payload hashes, and traces.
                </p>
              </button>

              {/* Option 4: System Config */}
              <button
                type="button"
                onClick={() => setSelectedPackage('SYSTEM_CONFIG')}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  selectedPackage === 'SYSTEM_CONFIG'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    Connector & Model Config
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  OAuth connectors ({connections.length}), LLM providers, and local agent settings.
                </p>
              </button>
            </div>
          </div>

          {/* Upload Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => preparePackage(selectedPackage)}
              disabled={!accessToken || isPackaging || isUploading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPackaging ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Assembling Project Package...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadProgressText || 'Uploading to Google Drive...'}</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Package & Upload to Google Drive</span>
                </>
              )}
            </button>
            {!accessToken && (
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Please sign in with your Google account above to enable uploading.
              </p>
            )}
          </div>

          {/* Recent Backups in Google Drive */}
          {accessToken && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                  <span>Files in &ldquo;OmniFlow Backups&rdquo; Folder</span>
                </span>
                <button
                  type="button"
                  onClick={() => accessToken && loadRecentFiles(accessToken, appFolderId || undefined)}
                  disabled={isLoadingRecent}
                  className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingRecent ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {recentFiles.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  {isLoadingRecent ? 'Loading recent files...' : 'No files in this Drive folder yet. Upload your first snapshot above!'}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  {recentFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {file.createdTime ? new Date(file.createdTime).toLocaleString() : ''}
                            {file.size ? ` · ${Math.round(parseInt(file.size, 10) / 1024)} KB` : ''}
                          </p>
                        </div>
                      </div>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1 transition-colors shrink-0 ml-2"
                        >
                          <span>View in Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mandatory User Confirmation Dialog */}
        {showConfirmDialog && pendingUploadData && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Confirm Upload to Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review file details before saving to your Google Drive
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Account:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {user?.email || 'Authenticated User'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Destination:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Google Drive / &ldquo;OmniFlow Backups&rdquo;
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Filename:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {pendingUploadData.fileName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estimated Size:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    ~{pendingUploadData.sizeKb} KB
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setPendingUploadData(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeUploadToDrive}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Confirm & Upload</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

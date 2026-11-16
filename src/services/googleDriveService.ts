import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );

const getFirebaseAuth = () => {
  if (!isFirebaseConfigured()) {
    throw new Error('Google Drive integration is not configured for this deployment.');
  }

  const app = getApps().find((candidate) => candidate.name === 'omniflow-drive') ??
    initializeApp(firebaseConfig, 'omniflow-drive');
  return getAuth(app);
};

// Configure Google Auth Provider with Google Drive file scope
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const provider = new GoogleAuthProvider();
provider.addScope(DRIVE_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

// Strictly in-memory access token storage per security & workspace-integration guidelines
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveUserInfo {
  displayName?: string;
  emailAddress?: string;
  photoLink?: string;
}

export interface DriveStorageQuota {
  limit?: string; // in bytes
  usage?: string; // in bytes
  usageInDrive?: string;
  usageInDriveTrash?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  createdTime?: string;
}

/**
 * Initialize Firebase Auth listener.
 * Clears in-memory token whenever the user is signed out.
 */
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!isFirebaseConfigured()) {
    onAuthFailure?.();
    return () => {};
  }

  return onAuthStateChanged(getFirebaseAuth(), async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Initiates client-side Google Sign-In with Google Drive file scope
 */
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Google Drive access token was not returned from authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Signs out and clears the in-memory access token
 */
export const signOutGoogleDrive = async (): Promise<void> => {
  try {
    if (isFirebaseConfigured()) {
      await signOut(getFirebaseAuth());
    }
  } finally {
    cachedAccessToken = null;
  }
};

/**
 * Retrieves the currently cached in-memory access token
 */
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Manually sets the access token in memory if re-authenticating
 */
export const setDriveAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

/**
 * Fetches the user profile and storage quota from Google Drive API v3
 */
export const fetchDriveAbout = async (
  accessToken: string
): Promise<{ user?: DriveUserInfo; storageQuota?: DriveStorageQuota }> => {
  const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Google Drive user info: ${res.status} ${errorText}`);
  }

  return await res.json();
};

/**
 * Finds or creates a designated folder in Google Drive for OmniFlow backups
 */
export const findOrCreateDriveFolder = async (
  folderName: string,
  accessToken: string
): Promise<string> => {
  // Check if folder already exists
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Directory for OmniFlow project backups, snapshots, and audit ledger archives',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder "${folderName}": ${createRes.status} ${errorText}`);
  }

  const created = await createRes.json();
  return created.id;
};

/**
 * Uploads a file to Google Drive using the Drive v3 multipart upload endpoint
 */
export const uploadFileToGoogleDrive = async (
  options: {
    fileName: string;
    mimeType: string;
    content: string | Blob;
    folderId?: string;
    description?: string;
  },
  accessToken: string
): Promise<DriveFileItem> => {
  const { fileName, mimeType, content, folderId, description } = options;

  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: mimeType,
    description: description || 'OmniFlow Project Export & Backup',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = `-------OmniFlowBoundary${Date.now().toString(16)}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let bodyContent = '';
  if (typeof content === 'string') {
    bodyContent = content;
  } else {
    // If Blob, read as text
    bodyContent = await content.text();
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    bodyContent +
    closeDelimiter;

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        Accept: 'application/json',
      },
      body: multipartRequestBody,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Google Drive upload failed (${uploadRes.status}): ${errText}`);
  }

  return await uploadRes.json();
};

/**
 * Lists files created by this application in Google Drive
 */
export const listGoogleDriveFiles = async (
  accessToken: string,
  folderId?: string
): Promise<DriveFileItem[]> => {
  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  const encodedQ = encodeURIComponent(q);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodedQ}&pageSize=30&orderBy=createdTime desc&fields=files(id,name,mimeType,webViewLink,size,createdTime)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to list Google Drive files: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.files || [];
};

import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const AUTH_APP_NAME = 'omniflow-login';

export type LoginProvider = 'github' | 'google';

export const isFirebaseAuthConfigured = (): boolean =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);

export const getFirebaseAuth = () => {
  if (!isFirebaseAuthConfigured()) {
    throw new Error('Sign-in is not configured for this deployment.');
  }

  const app = getApps().find((candidate) => candidate.name === AUTH_APP_NAME) ??
    initializeApp(firebaseConfig, AUTH_APP_NAME);
  return getAuth(app);
};

export const subscribeToAppAuth = (
  onUser: (user: User | null) => void,
  onError: (error: Error) => void
) => onAuthStateChanged(getFirebaseAuth(), onUser, onError);

export const signInWithProvider = async (providerId: LoginProvider): Promise<void> => {
  const provider =
    providerId === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();

  if (providerId === 'google') {
    provider.setCustomParameters({ prompt: 'select_account' });
  } else {
    provider.addScope('read:user');
  }

  await signInWithPopup(getFirebaseAuth(), provider);
};

export const signOutAppUser = async (): Promise<void> => {
  await signOut(getFirebaseAuth());
};

export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error('Sign in before making this request.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
  return fetch(input, { ...init, headers });
};

export const getFirebaseAuthErrorMessage = (error: unknown): string => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';

  switch (code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Sign in using its existing provider.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups and try again.';
    case 'auth/popup-closed-by-user':
      return 'The sign-in window was closed before authentication completed.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled for the Firebase project.';
    case 'auth/unauthorized-domain':
      return 'This site domain is not authorized in the Firebase project.';
    default:
      return 'Sign-in failed. Check the provider setup and try again.';
  }
};

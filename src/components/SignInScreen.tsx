import React, { useState } from 'react';
import { Github, Loader2, ShieldCheck } from 'lucide-react';
import {
  getFirebaseAuthErrorMessage,
  signInWithProvider,
  type LoginProvider,
} from '../services/firebaseAuthService';

interface SignInScreenProps {
  isConfigured: boolean;
  authError: string | null;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ isConfigured, authError }) => {
  const [pendingProvider, setPendingProvider] = useState<LoginProvider | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);

  const handleSignIn = async (provider: LoginProvider) => {
    setPendingProvider(provider);
    setSignInError(null);
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setSignInError(getFirebaseAuthErrorMessage(error));
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-indigo-950/40">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-center text-2xl font-bold tracking-tight">Sign in to OmniFlow</h1>
        <p className="mt-2 text-center text-sm leading-6 text-slate-400">
          Continue with GitHub or Google. Your password is handled by the provider and is never shared with OmniFlow.
        </p>

        {!isConfigured && (
          <p role="status" className="mt-6 rounded-xl border border-amber-700/60 bg-amber-950/40 p-3 text-sm text-amber-200">
            Sign-in is not configured yet. The site owner must configure Firebase Authentication before users can continue.
          </p>
        )}
        {(signInError || authError) && (
          <p role="alert" className="mt-6 rounded-xl border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-200">
            {signInError || authError}
          </p>
        )}

        <div className="mt-7 space-y-3">
          <button
            type="button"
            disabled={!isConfigured || pendingProvider !== null}
            onClick={() => handleSignIn('github')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingProvider === 'github' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
            Continue with GitHub
          </button>
          <button
            type="button"
            disabled={!isConfigured || pendingProvider !== null}
            onClick={() => handleSignIn('google')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingProvider === 'google' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span aria-hidden="true" className="text-base font-bold text-blue-600">G</span>
            )}
            Continue with Google
          </button>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Any account supported by the enabled providers can sign in.
        </p>
      </div>
    </main>
  );
};

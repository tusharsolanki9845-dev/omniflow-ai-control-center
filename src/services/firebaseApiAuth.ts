import { errors, createRemoteJWKSet, jwtVerify } from 'jose';
import type { RequestHandler } from 'express';

const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export type FirebaseIdTokenVerifier = (token: string, projectId: string) => Promise<boolean>;

const verifyFirebaseIdToken: FirebaseIdTokenVerifier = async (token, projectId) => {
  const { payload } = await jwtVerify(token, firebaseJwks, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });
  const firebaseClaims = payload.firebase;
  const signInProvider =
    typeof firebaseClaims === 'object' && firebaseClaims !== null
      ? Reflect.get(firebaseClaims, 'sign_in_provider')
      : null;
  return (
    typeof payload.sub === 'string' &&
    payload.sub.length > 0 &&
    typeof payload.exp === 'number' &&
    typeof payload.iat === 'number' &&
    typeof payload.auth_time === 'number' &&
    typeof signInProvider === 'string' &&
    ['github.com', 'google.com'].includes(signInProvider)
  );
};

export const createFirebaseAuthMiddleware = (
  getProjectId: () => string | undefined,
  verifyToken: FirebaseIdTokenVerifier = verifyFirebaseIdToken
): RequestHandler => async (req, res, next) => {
  const projectId = getProjectId();
  if (!projectId) {
    return res.status(503).json({ error: 'Authentication is not configured for this service.' });
  }

  const authorization = req.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign-in is required.' });
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ error: 'Sign-in is required.' });
  }

  try {
    if (!(await verifyToken(token, projectId))) {
      return res.status(401).json({ error: 'The sign-in token is invalid.' });
    }
    return next();
  } catch (error) {
    if (error instanceof errors.JOSEError) {
      return res.status(401).json({ error: 'The sign-in token is invalid or expired.' });
    }
    console.error('Firebase token verification failed:', error instanceof Error ? error.name : 'UnknownError');
    return res.status(503).json({ error: 'Authentication is temporarily unavailable.' });
  }
};

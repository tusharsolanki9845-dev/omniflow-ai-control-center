import {
  withLambda,
  type HandlerContext,
  type HandlerEvent,
  type HandlerResponse,
} from '@netlify/aws-lambda-compat';
import serverless from 'serverless-http';
import { app } from '../../server';

const expressHandler = serverless(app);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

async function handleRequest(event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> {
  const clientIp = event.headers['x-forwarded-for'];
  if (!clientIp) {
    throw new Error('Netlify did not provide the request IP address.');
  }
  const expressEvent = {
    ...event,
    requestContext: { identity: { sourceIp: clientIp } },
  };
  const response = await expressHandler(expressEvent, context);
  if (!isRecord(response) || typeof response.statusCode !== 'number' || !Number.isInteger(response.statusCode)) {
    throw new Error('The Express adapter returned an invalid response.');
  }

  const result: HandlerResponse = { statusCode: response.statusCode };
  if (response.body !== undefined) {
    if (typeof response.body !== 'string') {
      throw new Error('The Express adapter returned an invalid response body.');
    }
    result.body = response.body;
  }
  if (response.isBase64Encoded !== undefined) {
    if (typeof response.isBase64Encoded !== 'boolean') {
      throw new Error('The Express adapter returned an invalid encoding flag.');
    }
    result.isBase64Encoded = response.isBase64Encoded;
  }
  if (response.headers !== undefined) {
    if (!isRecord(response.headers)) {
      throw new Error('The Express adapter returned invalid response headers.');
    }
    const headers: NonNullable<HandlerResponse['headers']> = {};
    for (const [name, value] of Object.entries(response.headers)) {
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        throw new Error('The Express adapter returned an invalid response header value.');
      }
      headers[name] = value;
    }
    result.headers = headers;
  }
  return result;
}

const netlifyHandler = withLambda(handleRequest);

export default async (request: Request, context: Parameters<typeof netlifyHandler>[1]) => {
  const headers = new Headers(request.headers);
  headers.set('x-forwarded-for', context.ip);
  return netlifyHandler(new Request(request, { headers }), context);
};

export const config = {
  path: '/api/*',
};

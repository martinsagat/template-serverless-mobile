import { cors } from 'hono/cors';

const stage = process.env.STAGE ?? 'dev';

const allowedOrigins =
  stage === 'production'
    ? ['https://app.example.com'] // TODO: replace per project
    : stage === 'uat'
      ? ['https://uat.app.example.com'] // TODO: replace per project
      : true; // permissive in dev

export const corsMiddleware = cors({
  origin: allowedOrigins as never,
  credentials: true,
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  maxAge: 86400,
});

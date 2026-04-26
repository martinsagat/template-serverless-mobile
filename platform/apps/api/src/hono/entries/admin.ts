import { handle } from 'hono/aws-lambda';
import { adminApp } from '../apps/admin';

export const handler = handle(adminApp);

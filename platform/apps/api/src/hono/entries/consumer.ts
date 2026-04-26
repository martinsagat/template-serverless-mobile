import { handle } from 'hono/aws-lambda';
import { consumerApp } from '../apps/consumer';

export const handler = handle(consumerApp);

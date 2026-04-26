import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Resource } from 'sst';

export const dynamoClient = new DynamoDBClient({});

export const tableConfig = {
  table: Resource.appTable.name,
  client: dynamoClient,
};

/**
 * Single-table DynamoDB layout: pk/sk primary key + 6 generic GSIs + ttl.
 *
 * ElectroDB entities pin themselves to specific GSIs by name. Don't rename
 * the GSIs without checking every entity's `indexes:` block.
 */
export function createAppTable() {
  return new sst.aws.Dynamo('appTable', {
    fields: {
      pk: 'string',
      sk: 'string',
      gsi1pk: 'string',
      gsi1sk: 'string',
      gsi2pk: 'string',
      gsi2sk: 'string',
      gsi3pk: 'string',
      gsi3sk: 'string',
      gsi4pk: 'string',
      gsi4sk: 'string',
      gsi5pk: 'string',
      gsi5sk: 'string',
      gsi6pk: 'string',
      gsi6sk: 'string',
    },
    primaryIndex: { hashKey: 'pk', rangeKey: 'sk' },
    ttl: 'ttl',
    globalIndexes: {
      Gsi1Index: { hashKey: 'gsi1pk', rangeKey: 'gsi1sk' },
      Gsi2Index: { hashKey: 'gsi2pk', rangeKey: 'gsi2sk' },
      Gsi3Index: { hashKey: 'gsi3pk', rangeKey: 'gsi3sk' },
      Gsi4Index: { hashKey: 'gsi4pk', rangeKey: 'gsi4sk' },
      Gsi5Index: { hashKey: 'gsi5pk', rangeKey: 'gsi5sk' },
      Gsi6Index: { hashKey: 'gsi6pk', rangeKey: 'gsi6sk' },
    },
  });
}

export type AppTable = ReturnType<typeof createAppTable>;

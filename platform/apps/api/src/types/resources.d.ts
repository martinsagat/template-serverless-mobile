/**
 * Module-augmentation declaring the SST Resources this API expects.
 *
 * SST auto-generates `platform/sst-env.d.ts` on `sst dev` / `sst deploy` — that
 * file (gitignored) supplements these declarations with the real provisioned
 * names. We keep this file in source control so type-checking passes BEFORE
 * the first deploy on a fresh clone.
 */
declare module 'sst' {
  interface Resource {
    appTable: {
      name: string;
      type: 'sst.aws.Dynamo';
    };
  }
}

export {};

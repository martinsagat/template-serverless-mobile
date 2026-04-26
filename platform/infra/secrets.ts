/**
 * Project-wide secrets. Set values with: `pnpm sst secret set <NAME> <value>`.
 *
 * The placeholder secret below exists only so the secrets module has at least
 * one export and the linker is happy. Replace it (or just delete it) and add
 * the secrets your project actually needs.
 *
 * Common patterns to add per project:
 *
 *   export const sendGridApiKey = new sst.Secret('SendGridApiKey');
 *   export const stripeSecretKey = new sst.Secret('StripeSecretKey');
 *   export const twilioAccountSid = new sst.Secret('TwilioAccountSid');
 *   export const twilioAuthToken = new sst.Secret('TwilioAuthToken');
 *   export const slackWebhookUrl = new sst.Secret('SlackWebhookUrl');
 */
export const appPlaceholderSecret = new sst.Secret(
  'AppPlaceholderSecret',
  'unset',
);

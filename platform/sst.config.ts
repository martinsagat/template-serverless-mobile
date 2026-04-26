/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'app',
      home: 'aws',
      providers: {
        aws: {
          region: 'ap-southeast-2',
        },
      },
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      tags: {
        Environment: input?.stage || 'dev',
        Project: 'app',
        ManagedBy: 'SST',
      },
    };
  },
  async run() {
    if ($app.stage === 'production') {
      const { deployProduction } = await import(
        './infra/deployments/production'
      );
      return deployProduction();
    }
    if ($app.stage === 'uat') {
      const { deployUat } = await import('./infra/deployments/uat');
      return deployUat();
    }
    const { deployDevelopment } = await import(
      './infra/deployments/development'
    );
    return deployDevelopment();
  },
});

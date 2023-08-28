import { defineConfig } from 'cypress';
import * as webpackConfig from 'visyn_scripts/config/webpack.config';

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  defaultCommandTimeout: 10000,
  e2e: {
    numTestsKeptInMemory: 20,
    baseUrl: 'http://localhost:8080',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          // const newArgs = launchOptions.filter((arg) => arg !== '--disable-gpu');
          launchOptions.args.push('--ignore-gpu-blacklist');
          return launchOptions;
        }
      });
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
      webpackConfig: webpackConfig({ workspace_mode: 'single' }, { mode: 'production' }),
    },
  },
});

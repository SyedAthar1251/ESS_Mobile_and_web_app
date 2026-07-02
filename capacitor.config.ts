import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'alphax_ess.workforce',
  appName: 'ESS Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;

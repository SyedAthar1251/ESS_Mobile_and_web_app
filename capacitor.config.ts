import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ess.mobile',
  appName: 'ESS Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'http'
  }
};

export default config;

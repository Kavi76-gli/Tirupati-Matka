import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kalyanmaster.app',
  appName: 'Tirupati Matka',
  webDir: 'public',
  server: {
    url: 'https://tirupati-matka.onrender.com',
    cleartext: false
  }
};

export default config;
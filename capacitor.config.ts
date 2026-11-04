import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danonino.app',
  appName: 'Danonino',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#070a13'
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      style: 'dark'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#070a13'
    }
  }
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kore.ops',
  appName: 'Kore',
  webDir: 'dist',
  server: {
    // Capacitor sirve la app desde https://localhost en Android
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#313852',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#313852',
    },
  },
};

export default config;

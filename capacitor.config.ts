import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mangafy.ai',
  appName: 'Mangafy.Ai',
  webDir: 'mobile-web',
  server: {
    url: "https://www.mangafyai.com",
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const getVal = (key: string) => env[key] || process.env[key] || '';

  const apiKey = getVal('VITE_FIREBASE_API_KEY') || getVal('FIREBASE_API_KEY') || getVal('NEXT_PUBLIC_FIREBASE_API_KEY');
  const authDomain = getVal('VITE_FIREBASE_AUTH_DOMAIN') || getVal('FIREBASE_AUTH_DOMAIN') || getVal('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  const projectId = getVal('VITE_FIREBASE_PROJECT_ID') || getVal('FIREBASE_PROJECT_ID') || getVal('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  const storageBucket = getVal('VITE_FIREBASE_STORAGE_BUCKET') || getVal('FIREBASE_STORAGE_BUCKET') || getVal('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  const messagingSenderId = getVal('VITE_FIREBASE_MESSAGING_SENDER_ID') || getVal('FIREBASE_MESSAGING_SENDER_ID') || getVal('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  const appId = getVal('VITE_FIREBASE_APP_ID') || getVal('FIREBASE_APP_ID') || getVal('NEXT_PUBLIC_FIREBASE_APP_ID');
  const firebaseConfigJson = getVal('FIREBASE_CONFIG') || getVal('VITE_FIREBASE_CONFIG');

  return {
    base: './',
    envPrefix: ['VITE_', 'FIREBASE_', 'NEXT_PUBLIC_', 'REACT_APP_'],
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.FIREBASE_CONFIG': JSON.stringify(firebaseConfigJson),
      'process.env.FIREBASE_API_KEY': JSON.stringify(apiKey),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(authDomain),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(projectId),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(storageBucket),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(messagingSenderId),
      'process.env.FIREBASE_APP_ID': JSON.stringify(appId),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

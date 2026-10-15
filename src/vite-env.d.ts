/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase Web Config
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;

  // Store Business Config
  readonly VITE_STORE_NAME: string;
  readonly VITE_OWNER_WHATSAPP: string;
  readonly VITE_OWNER_PHONE: string;
  readonly VITE_SUPPORT_EMAIL: string;
  readonly VITE_DELIVERY_AREAS: string;
  readonly VITE_CURRENCY_SYMBOL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

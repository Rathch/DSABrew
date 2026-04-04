/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Root-`package.json` (`version`), zur Build-Zeit eingesetzt */
  readonly VITE_APP_VERSION: string;
}

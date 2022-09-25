import { BrowserType } from "./browser.js"

export type EnvType = {
  browserPaths: { [id in BrowserType]: string },
  store: { [id in 'mozillaAddons' | 'mozillaAddonsAndroid' | 'chromeStore' | 'operaDeveloper' | 'edgeAddons']: string },
  browser: {
    chrome: { googleOauthClientId: string }, "firefox-android"?: {
      adbBin?: string;
      adbHost: string;
      adbPort?: string;
      adbDevice?: string;
      adbDiscoveryTimeout?: number;
      adbRemoveOldArtifacts?: boolean;
      firefoxApk?: string;
      firefoxApkComponent?: string
    }
  }
}

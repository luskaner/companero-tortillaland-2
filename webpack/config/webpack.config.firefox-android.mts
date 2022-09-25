import webpack from 'webpack';
const { ProvidePlugin } = webpack;
import { WebExtPluginOptions } from '../plugins/web-ext-webpack-plugin/index.js'
import getConfigs, { env } from './webpack.config.base.mjs'
import { EnvType } from '../types/env.js';

const webExtOptions: WebExtPluginOptions = { target: 'firefox-android', runLint: true }
const platformKey = 'firefox-android'
if ( env?.browser?.[platformKey] ) {
  const adbFields = new Set<keyof WebExtPluginOptions>( ["adbBin", "adbHost", "adbPort", "adbDevice", "adbDiscoveryTimeout", "adbRemoveOldArtifacts", "firefoxApk", "firefoxApkComponent"] )
  const adbFieldsFilled = Object.keys( env.browser[platformKey] )
  for ( const adbField of adbFields ) {
    if ( adbFieldsFilled.includes( adbField ) ) {
      ( webExtOptions[adbField] as unknown ) = env.browser[platformKey][adbField as keyof EnvType["browser"]["firefox-android"]];
    }
  }
}

export default getConfigs( {
  browserslistEnv: 'firefox-android', manifestVersion: 2, identityPolyfill: true, manifestGenerator: ( baseManifest, minimumVersion ) => {
    baseManifest.browser_specific_settings = {
      gecko: {
        id: ( env as EnvType ).store.mozillaAddons,
        strict_min_version: minimumVersion
      }
    }
    return baseManifest
  }, webExtOptions,
  workerPlugins: [
    new ProvidePlugin( { 'browser.identity.launchWebAuthFlow': ['/src/ts/compat/firefox-android/browser.identity.launchWebAuthFlow.ts', 'default'] } ),
  ]
} )



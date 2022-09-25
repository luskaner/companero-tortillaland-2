import webpack from 'webpack';
import { EnvType } from '../types/env.js';
const { NormalModuleReplacementPlugin } = webpack;
import { env, youtubeNeeded } from './webpack.config.base.mjs'
import getConfigs from './webpack.config.chromium.mjs'

const workerPlugins = []

if ( youtubeNeeded ) {
  workerPlugins.push( new NormalModuleReplacementPlugin( /YoutubeBackgroundPlatformCompile/, '../../compat/chromeStore/DynamicYoutubeBackgroundPlatform' ) )
}

export default getConfigs( {
  manifestGenerator: ( baseManifest ) => {
    (baseManifest as chrome.runtime.Manifest).key = (env as EnvType).store.chromeStore
    if ( youtubeNeeded ) {
      (baseManifest as chrome.runtime.Manifest).oauth2 = {
        client_id: (env as EnvType).browser.chrome.googleOauthClientId,
        scopes: []
      }
    }
    return baseManifest
  }, workerPlugins
} )


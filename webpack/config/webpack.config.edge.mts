import getConfigs from './webpack.config.chromium.mjs'
import { env, transformPathWithVariables } from './webpack.config.base.mjs'
import { EnvType } from '../types/env.js'

export default getConfigs( {
  browserslistEnv: 'edge', manifestGenerator: ( baseManifest ) => {
    (baseManifest as chrome.runtime.Manifest).key = (env as EnvType).store.edgeAddons
    return baseManifest
  }, webExtOptions: { chromiumBinary: transformPathWithVariables( (env as EnvType).browserPaths.edge ) }
} )

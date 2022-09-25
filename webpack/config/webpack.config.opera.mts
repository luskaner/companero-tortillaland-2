import getConfigs from './webpack.config.chromium.mjs'
import { env, getMinimumVersion, transformPathWithVariables } from './webpack.config.base.mjs'
import { EnvType } from '../types/env.js'

export default getConfigs( {
  browserslistEnv: 'opera', manifestGenerator: ( baseManifest ) => {
    baseManifest.minimum_chrome_version = getMinimumVersion( 'chrome' )
    baseManifest.developer = { name: (env as EnvType).store.operaDeveloper }
    return baseManifest
  }, webExtOptions: { chromiumBinary: transformPathWithVariables( (env as EnvType).browserPaths.opera ) }
} )

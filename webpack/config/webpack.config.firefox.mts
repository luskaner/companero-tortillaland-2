import { EnvType } from '../types/env.js'
import getConfigs, { env, transformPathWithVariables } from './webpack.config.base.mjs'

export default getConfigs( {
  browserslistEnv: 'firefox', manifestVersion: 2, manifestGenerator: ( baseManifest, minimumVersion ) => {
    baseManifest.browser_specific_settings = {
      gecko: {
        id: (env as EnvType).store.mozillaAddons,
        strict_min_version: minimumVersion
      }
    }
    return baseManifest
  }, webExtOptions: { firefox: transformPathWithVariables( (env as EnvType).browserPaths.firefox ), target: 'firefox-desktop', runLint: true }
} )



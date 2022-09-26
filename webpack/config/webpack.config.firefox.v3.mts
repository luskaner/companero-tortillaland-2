import { EnvType } from '../types/env.js'
import getConfigs, { env, transformPathWithVariables } from './webpack.config.base.mjs'

export default getConfigs( {
  browserslistEnv: 'firefox.v3', manifestGenerator: ( baseManifest, minimumVersion ) => {
    baseManifest.browser_specific_settings = {
      gecko: {
        id: (env as EnvType).store.mozillaAddons,
        strict_min_version: minimumVersion
      }
    }
    baseManifest.background = {
      scripts: [( baseManifest.background as { service_worker: string } ).service_worker]
    }
    return baseManifest
  }, webExtOptions: { firefox: transformPathWithVariables( (env as EnvType).browserPaths.firefox ), target: 'firefox-desktop', firefoxPreview: 'mv3' }
} )

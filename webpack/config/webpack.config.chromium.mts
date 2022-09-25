import webpack, { Compiler, WebpackPluginInstance } from 'webpack';
import { ConfigOptions } from 'webpack-cli';
import { EnvType } from '../types/env.js';
const { ProvidePlugin, DefinePlugin } = webpack;
import getConfigsBase, { env, getConfigsArgsOptional, transformPathWithVariables } from './webpack.config.base.mjs'


const extraCommonPlugins = [
  new DefinePlugin( { 'browser': 'chrome' } )
]
const extraWorkerPlugins = [
  new ProvidePlugin( { 'browser.identity.launchWebAuthFlow': ['/src/ts/compat/chromium/browser.identity.launchWebAuthFlow.ts', 'default'] } )
]
const extraPagePlugins: ( ( ( this: Compiler, compiler: Compiler ) => void ) | WebpackPluginInstance )[] = []

export default function getConfigs( { browserslistEnv = 'chrome', manifestGenerator = (manifest) => manifest, webExtOptions = {}, workerPlugins = [], pagePlugins = [] }: getConfigsArgsOptional ): ConfigOptions[] {
  return getConfigsBase( {
    browserslistEnv,
    manifestGenerator: ( baseManifest, minimumVersion ) => {
      baseManifest.minimum_chrome_version = minimumVersion
      return manifestGenerator( baseManifest, minimumVersion )
    },
    webExtOptions: { chromiumBinary: transformPathWithVariables( (env as EnvType).browserPaths.chrome ), ...webExtOptions },
    workerPlugins: [...extraCommonPlugins, ...extraWorkerPlugins, ...workerPlugins],
    pagePlugins: [...extraCommonPlugins, ...extraPagePlugins, ...pagePlugins]
  } )
}

import webpack from 'webpack';
import { ConfigOptions } from 'webpack-cli';

const { DefinePlugin, ProvidePlugin } = webpack;
import getConfigsBase, { getConfigsArgs } from './webpack.config.base.mjs'

const extraCommonPlugins = [
  new DefinePlugin( { 'browser': '(globalThis.browser ?? globalThis.chrome)' } )
]

const extraWorkerPlugins = [
  new ProvidePlugin( { 'browser.windows.create': ['/src/ts/compat/chromium/browser.windows.create.ts', 'default'] } ),
  new ProvidePlugin( { 'browser.windows.remove': ['/src/ts/compat/chromium/browser.windows.remove.ts', 'default'] } ),
  new ProvidePlugin( { 'browser.tabs.create': ['/src/ts/compat/chromium/browser.tabs.create.ts', 'default'] } ),
  new ProvidePlugin( { 'browser.tabs.remove': ['/src/ts/compat/chromium/browser.tabs.remove.ts', 'default'] } )
]

export default function getConfigs( { browserslistEnv, manifestGenerator = ( manifest ) => manifest, webExtOptions = {}, workerPlugins = [], pagePlugins = [] }: getConfigsArgs ): ConfigOptions[] {
  return getConfigsBase( {
    browserslistEnv,
    identityPolyfill: true,
    manifestGenerator,
    webExtOptions,
    workerPlugins: [...extraCommonPlugins, ...extraWorkerPlugins, ...workerPlugins],
    pagePlugins: [...extraCommonPlugins, ...pagePlugins]
  } )
}

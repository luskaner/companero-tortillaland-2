import { dirname, resolve } from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import browserslist from 'browserslist';
import GenerateJsonPlugin from 'generate-json-webpack-plugin';
import { readFileSync, rmSync, readdirSync, statSync, existsSync } from 'fs';
import WebExtPlugin, { WebExtPluginOptions } from '../plugins/web-ext-webpack-plugin/index.js';
import { ConfigOptions, WebpackConfiguration } from 'webpack-cli'
import webpack, { Compiler, WebpackPluginInstance } from 'webpack';
const { NormalModuleReplacementPlugin, ProvidePlugin, DefinePlugin } = webpack;
import { fileURLToPath } from 'url';
import { EnvType } from '../types/env.js';
import { BrowserType } from '../types/browser.js';
import { DataType } from '../../src/ts/types/data.js'
import getRedirectURL from '../../src/ts/compat/browser.identity/getRedirectURL.js'


const __dirname = dirname( fileURLToPath( import.meta.url ) );
const baseLocales = resolve( __dirname, '../../_locales' )
const envPath = resolve( __dirname, '../data/env.json' )
export let env: EnvType | undefined = undefined
if ( existsSync( envPath ) ) {
  env = JSON.parse( readFileSync( envPath, 'utf8' ) )
}
const data = JSON.parse( readFileSync( __dirname + '/../../assets/data/data.json', 'utf8' ) ) as DataType

export const youtubeNeeded = data.channels.some( c => c.startsWith( 'youtube:' ) )

export function transformPathWithVariables( path: string ) {
  return path.replace( /\$([A-Z_]+[A-Z0-9_]*)|\${([A-Z0-9_]*)|}/ig, ( _, a, b ) => process.env[a || b] ?? '' ).replace( /%([^%]+)%/g, ( _, n ) => process.env[n] ?? '' )
}

export function getMinimumVersion( browserslistEnv: string ) {
  const versions = browserslist( null, { env: browserslistEnv } )
  let version = versions[versions.length - 1].split( " " )[1]
  if ( !version.includes( '.' ) ) {
    version += '.0'
  }
  return version
}

function getLocaleGenerateJsonPlugins( browserslistEnv: BrowserType ) {
  const plugins: GenerateJsonPlugin[] = []
  for ( const file of readdirSync( baseLocales ) ) {
    const filePath = resolve( '_locales', file )
    if ( statSync( filePath ).isDirectory() ) {
      const baseLocalePath = resolve( filePath, 'messages.json' )
      if ( existsSync( baseLocalePath ) && statSync( baseLocalePath ).isFile() ) {
        let fullLocale = JSON.parse( readFileSync( baseLocalePath, 'utf-8' ) )
        const fullLocaleBrowserPath = resolve( filePath, `messages.${ browserslistEnv }.json` )
        if ( existsSync( fullLocaleBrowserPath ) ) {
          fullLocale = { ...fullLocale, ...JSON.parse( readFileSync( fullLocaleBrowserPath, 'utf-8' ) ) }
        }
        if ( youtubeNeeded ) {
          const youtubeLocalePath = resolve( filePath, 'messages.youtube.json' )
          if ( existsSync( youtubeLocalePath ) && statSync( youtubeLocalePath ).isFile() ) {
            fullLocale = { ...fullLocale, ...JSON.parse( readFileSync( youtubeLocalePath, 'utf-8' ) ) }
          }
          const youtubeLocaleBrowserPath = resolve( filePath, `messages.youtube.${ browserslistEnv }.json` )
          if ( existsSync( youtubeLocaleBrowserPath ) ) {
            fullLocale = { ...fullLocale, ...JSON.parse( readFileSync( youtubeLocaleBrowserPath, 'utf-8' ) ) }
          }
        }
        plugins.push( new GenerateJsonPlugin( `_locales/${ file }/messages.json`, fullLocale ) )
      }
    }
  }
  return plugins
}

function baseConfig( baseSrcPath: string, browserslistEnv: BrowserType ): WebpackConfiguration {
  return {
    mode: 'production',
    entry: {},
    devtool: 'source-map',
    output: {
      filename: `./js/[name].bundle.js`,
      path: baseSrcPath,
      publicPath: '/',
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [{
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { modules: false, browserslistEnv }]
              ]
            }
          }, 'ts-loader'],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts']
    },
    experiments: {
      topLevelAwait: true
    },
    optimization: {
      minimize: false,
      mangleExports: false
    },
    plugins: []
  }
}

export interface getConfigsArgs extends getConfigsArgsOptional {
  browserslistEnv: BrowserType
}

export interface getConfigsArgsOptional {
  identityPolyfill?: boolean
  browserslistEnv?: BrowserType
  manifestVersion?: number
  manifestGenerator?: ( baseManifest: browser._manifest.WebExtensionManifest | chrome.runtime.Manifest, minimumVersion: string ) => browser._manifest.WebExtensionManifest | chrome.runtime.Manifest
  webExtOptions?: WebExtPluginOptions
  pagePlugins?: ( ( ( this: Compiler, compiler: Compiler ) => void ) | WebpackPluginInstance )[]
  workerPlugins?: ( ( ( this: Compiler, compiler: Compiler ) => void ) | WebpackPluginInstance )[]
}

export default function getConfigs( { browserslistEnv, identityPolyfill = false, manifestVersion = 3, manifestGenerator = manifest => manifest, webExtOptions = {}, pagePlugins = [], workerPlugins = [] }: getConfigsArgs ): ConfigOptions[] {
  const basePath = resolve( __dirname, '../../dist', browserslistEnv )

  if ( !process.argv.includes( 'watch' ) ) {
    rmSync( basePath, { force: true, recursive: true, maxRetries: 3, retryDelay: 3333 } )
  }

  const baseSrcPath = resolve( basePath, 'src' )
  const workerConfig = baseConfig( baseSrcPath, browserslistEnv )
  workerConfig.target = 'webworker';
  if ( !workerConfig.plugins ) {
    workerConfig.plugins = []
  }
  ( workerConfig.entry as { background: string } ).background = './src/ts/background.ts';
  workerConfig.plugins.push( ...workerPlugins )
  const extraWorkerPlugins: getConfigsArgsOptional["workerPlugins"] = []
  const extraPagePlugins: getConfigsArgsOptional["pagePlugins"] = []

  if ( manifestVersion === 2 ) {
    const browserActionCompat = new DefinePlugin( {
      'browser.action': 'browser.browserAction'
    } )
    extraWorkerPlugins.push( browserActionCompat )
    extraPagePlugins.push( browserActionCompat )
    extraWorkerPlugins.push( new ProvidePlugin( { 'browser.runtime.getManifest': ['/src/ts/compat/v2/browser.runtime.getManifest.ts', 'default'] } ) )
  }

  if ( identityPolyfill ) {
    extraWorkerPlugins.push( new ProvidePlugin( { 'browser.identity.launchWebAuthFlow': ['/src/ts/compat/browser.identity/launchWebAuthFlow.ts', 'default'] } ) )
    extraWorkerPlugins.push( new ProvidePlugin( { 'browser.identity.getRedirectURL': ['/src/ts/compat/browser.identity/getRedirectURL.ts', 'default'] } ) )
  }

  if ( youtubeNeeded ) {
    extraWorkerPlugins.push( new NormalModuleReplacementPlugin( /BackgroundPlatformListCompile/, './platform/background/TwitchYoutubeBackgroundPlatformList' ) )
    extraPagePlugins.push( new NormalModuleReplacementPlugin( /ForegroundPlatformListCompile/, '../../platform/foreground/TwitchYoutubeForegroundPlatformList' ) )
  }

  ( workerConfig.plugins as ( ( ( this: Compiler, compiler: Compiler ) => void ) | WebpackPluginInstance )[] ).push( ...extraWorkerPlugins )
  return [
    ( environment ): WebpackConfiguration => {
      const minimumVersion = getMinimumVersion( browserslistEnv )
      const baseManifest = JSON.parse( readFileSync( 'webpack/data/base.manifest.json', 'utf8' ) ) as browser._manifest.WebExtensionManifest
      const versions = JSON.parse( readFileSync( 'webpack/data/versions.json', 'utf8' ) )
      baseManifest.version = versions[browserslistEnv] ?? "1.0"
      if ( identityPolyfill ) {
        if ( !baseManifest.permissions ) {
          baseManifest.permissions = []
        }
        baseManifest.permissions = baseManifest.permissions.filter( p => p !== 'identity' );
      }
      if ( manifestVersion === 2 ) {
        baseManifest.manifest_version = 2
        baseManifest.background = {
          scripts: [( baseManifest.background as { service_worker: string } ).service_worker],
          persistent: false
        }
        baseManifest.browser_action = baseManifest.action
        delete baseManifest.action
        if ( identityPolyfill ) {
          ( baseManifest.permissions as string[] ).push( `${ getRedirectURL.default() }*` )
        }
      } else if ( identityPolyfill ) {
        if ( !baseManifest.host_permissions ) {
          baseManifest.host_permissions = []
        }
        baseManifest.host_permissions.push( `${ getRedirectURL.default() }*` )
      }

      const pageConfig = baseConfig( baseSrcPath, browserslistEnv )
      if ( !pageConfig.optimization ) {
        pageConfig.optimization = {}
      }
      if ( !pageConfig.entry ) {
        pageConfig.entry = {}
      }
      const entry = pageConfig.entry as { popup: string, login: string, options: string }

      pageConfig.target = `browserslist:${ browserslistEnv }`;

      pageConfig.optimization.runtimeChunk = 'single'
      pageConfig.optimization.concatenateModules = !environment?.WEBPACK_WATCH
      entry['popup'] = './src/ts/html/popup/main.ts'
      entry['login'] = './src/ts/html/popup/login.ts'
      entry['options'] = './src/ts/html/options/main.ts';

      if ( !pageConfig.module ) {
        pageConfig.module = {}
      }

      if ( !pageConfig.module.rules ) {
        pageConfig.module.rules = []
      }

      pageConfig.module.rules.push( ...[
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader", {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      browsers: browserslist( null, { env: browserslistEnv } )
                    }
                  ],
                ],
              },
            }
          }],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|ttf)$/i,
          type: 'asset/resource',
          generator: {
            filename: '[file]'
          }
        },
        {
          test: /\.html$/i,
          loader: "html-loader",
        }
      ] );

      if ( !pageConfig.plugins ) {
        pageConfig.plugins = []
      }

      pageConfig.plugins.push( ...[
        new HtmlWebpackPlugin( {
          scriptLoading: 'module',
          filename: 'html/popup/main.html',
          chunks: ['popup'],
          template: 'src/html/popup/main.html',
          minify: false
        } ),
        new HtmlWebpackPlugin( {
          scriptLoading: 'module',
          filename: 'html/popup/login.html',
          chunks: ['login'],
          template: 'src/html/popup/login.html',
          minify: false
        } ),
        new HtmlWebpackPlugin( {
          scriptLoading: 'module',
          filename: 'html/options/main.html',
          chunks: ['options'],
          template: 'src/html/options/main.html',
          minify: false,
        } ),
        new CopyPlugin( {
          patterns: [{ from: "assets/images/logos", to: "assets/images/logos" }],
        } ),
        new GenerateJsonPlugin( 'manifest.json', manifestGenerator( baseManifest, minimumVersion ) ),
        new WebExtPlugin( {
          sourceDir: baseSrcPath,
          buildPackage: !environment?.WEBPACK_WATCH,
          outputFilename: 'package.zip',
          artifactsDir: resolve( basePath, 'pkg' ),
          overwriteDest: true,
          browserConsole: environment?.WEBPACK_WATCH,
          runLint: false,
          target: 'chromium',
          ...webExtOptions
        } ),
        ...pagePlugins,
        ...extraPagePlugins,
        ...getLocaleGenerateJsonPlugins(browserslistEnv)
      ] )

      return pageConfig
    },
    workerConfig
  ]
}

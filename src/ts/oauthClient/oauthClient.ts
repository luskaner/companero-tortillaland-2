import Identified from "../Identified"

export interface CachedOauthData {
  access_token?: string
  connected?: boolean
}

export type Thumbnail = {
  expiration: number
  obtained: number
  time_left?: number
}

type ProvidersCache = Record<string, ProviderCache>
type ProviderCache = { data: Record<string, unknown>, oauth: CachedOauthData }

export default abstract class OauthClient implements Identified {
  private static readonly LOGIN_STATE_CHARACTERS = 'abcdefghijklmnopqrstuvwxyz0123456789'

  constructor( protected readonly clientId: string, protected scope?: Set<string> ) {

  }

  get scopes() {
    return this.scope;
  }

  private authorizeState(): string {
    let result = ''
    const charactersLength = OauthClient.LOGIN_STATE_CHARACTERS.length
    for ( let i = 0; i < 32; i++ ) {
      result += OauthClient.LOGIN_STATE_CHARACTERS.charAt( Math.floor( Math.random() * charactersLength ) )
    }
    return result
  }

  async authorize( interactive = true ): Promise<boolean> {
    const parameters = new URLSearchParams(
      {
        response_type: 'token',
        client_id: this.clientId,
        redirect_uri: browser.identity.getRedirectURL(),
        state: this.authorizeState(),
        ...( ( this.scope?.size ?? 0 ) > 0 && { scope: [...( this.scope as Set<string> )].join( ' ' ) } )
      }
    )
    let success = false
    try {
      const responseUrl = await browser.identity.launchWebAuthFlow(
        {
          url: new URL( `${ this.authorizeUrl() }?${ parameters }` ).toString(),
          interactive
        } )
      const url = new URL( responseUrl )
      const hash = new URLSearchParams( url.hash.substring( 1 ) )
      if ( hash.get( 'state' ) === parameters.get( 'state' ) ) {
        if ( hash.has( 'access_token' ) ) {
          const access_token = hash.get( 'access_token' ) as string
          if ( await this.validate( access_token ) ) {
            await this.updateOauthCache( {
              access_token,
              connected: true
            } )
            success = true
          }
        }
      }
    } catch {
      success = false
    } finally {
      if ( !success ) {
        await this.clearCache()
      }
    }
    return success
  }

  async connected(): Promise<boolean> {
    const cache = await this.getOauthCache()
    return cache.connected ?? false
  }

  async ensureAuthorized(): Promise<boolean> {
    const cache = await this.getOauthCache()
    if ( cache.access_token ) {
      if ( await this.validate( cache.access_token ) ) {
        return true
      } else if ( await this.connected() ) {
        return await this.authorize( false )
      }
    }
    return false
  }

  protected async getAuthorizationHeader(): Promise<HeadersInit> {
    const cache = await this.getOauthCache()
    return {
      Authorization: `Bearer ${ cache.access_token }`
    }
  }

  protected async getOauthCache(): Promise<CachedOauthData> {
    const provider = await this.getProviderCache()
    return provider.oauth
  }

  protected async updateOauthCache( data: CachedOauthData ): Promise<void> {
    await this.updateCache( 'oauth', data as Record<string, unknown> )
  }

  private async updateCache( field: keyof ProviderCache, data: Record<string, unknown> ): Promise<void> {
    const providers = await this.getRootCache()
    const provider = await this.getProviderCache()
    provider[field] = data
    providers[this.identifier()] = provider
    await browser.storage.local.set( { providers } )
  }

  async updateDataCache( data: Record<string, unknown> ): Promise<void> {
    await this.updateCache( 'data', data )
  }

  async clearCache() {
    const providers = await this.getRootCache()
    delete providers[this.identifier()]
    await browser.storage.local.set( { providers } )
  }

  private async getRootCache(): Promise<ProvidersCache> {
    let { providers } = await browser.storage.local.get( 'providers' )
    if ( !providers ) {
      providers = {}
      await browser.storage.local.set( { providers } )
    }
    return providers
  }

  private async getProviderCache(): Promise<ProviderCache> {
    const providers = await this.getRootCache()
    const identifierKey = this.identifier()
    if ( !providers[identifierKey] ) {
      providers[identifierKey] = { data: {}, oauth: {} }
      await browser.storage.local.set( { providers } )
    }
    return providers[this.identifier()]
  }

  async getDataCache(): Promise<Record<string, unknown>> {
    const provider = await this.getProviderCache()
    return provider.data
  }

  protected async handleResponseCode( code: number ) {
    if ( code === 401 ) {
      await this.revoke( false )
    }
  }

  async revoke( interactive = true ): Promise<void> {
    const data = await this.getOauthCache()
    const accessToken = data.access_token
    if ( interactive ) {
      await this.clearCache()
    } else {
      data.access_token = undefined
      await this.updateOauthCache( data )
    }
    if ( accessToken ) {
      await this.doRevoke( this.clientId, accessToken )
    }
  }

  private async generateAuthorizedFetch( input: URL | RequestInfo, init?: RequestInit | undefined ): Promise<Response> {
    const composedInit = init ?? {}
    const composedHeaders = composedInit.headers ?? {}
    composedInit.headers = composedHeaders

    for ( const [authorizationName, authorizationValue] of Object.entries( await this.getAuthorizationHeader() ) ) {
      ( composedHeaders as Record<string, unknown> )[authorizationName] = authorizationValue
    }
    return await fetch( this.baseURL().toString() + '/' + input.toString(), composedInit )
  }

  protected async authorizedFetch( input: URL | RequestInfo, init?: RequestInit | undefined ): Promise<Response> {
    let response = await this.generateAuthorizedFetch( input, init )
    if ( response.status === 401 ) {
      const success = await this.authorize( false )
      if ( success ) {
        response = await this.generateAuthorizedFetch( input, init )
      }
    }
    this.handleResponseCode( response.status )
    return response
  }

  abstract identifier(): string
  protected abstract authorizeUrl(): URL

  protected abstract validate( accessToken: string ): Promise<boolean>

  protected abstract doRevoke( clientId: string, accessToken: string ): Promise<void>

  protected abstract baseURL(): URL
}

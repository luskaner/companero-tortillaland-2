import OauthClient from "../oauthClient"
import { Scope } from "./scope"
import { Validate, Stream, FollowedStream, User } from "./types"

export interface CachedData {
  user_id?: string
  scope: string[]
}

export default class OauthTwitchAPIClient extends OauthClient {
  private static readonly OAUTH_API_URL = new URL( 'https://id.twitch.tv/oauth2' )

  constructor( clientId: string, scope?: Set<Scope> ) {
    super( clientId, scope )
  }

  async init() {
    const data = await this.getDataCache() as unknown as CachedData
    if ( this.scope === undefined ) {
      this.scope = new Set( data.scope )
    } else {
      data.scope = [...this.scope]
      await this.updateDataCache( data as unknown as Record<string, unknown>)
    }
  }

  protected async validate( accessToken: string ): Promise<boolean> {
    const response = await fetch( `${ OauthTwitchAPIClient.OAUTH_API_URL }/validate`, { headers: { Authorization: `OAuth ${ accessToken }` } } )
    await this.handleResponseCode( response.status )
    if ( response.ok ) {
      if ( this.scopes?.has( Scope.USER_READ_FOLLOWS ) ) {
        const jsonResponse = await response.json() as Validate
        const data = await this.getDataCache() as unknown as CachedData
        data.user_id = jsonResponse.user_id
        await this.updateDataCache( data as unknown as Record<string, unknown>)
      }
      return true
    }
    return false
  }

  async getUsers( userLogins: Set<string> ): Promise<User[] | null> {
    const logins = [...userLogins]
    const urls = []
    do {
      const params = new URLSearchParams()
      for ( let i = 0; i < 100 && logins.length > 0; i++ ) {
        params.append( 'login', logins.pop() as string )
      }
      urls.push( `users?${ params }` )
    } while ( logins.length > 0 )
    return await this.getFullResponse( urls ) as User[] | null
  }

  async getStreams( userLogins: Set<string> ): Promise<Stream[] | null> {
    const logins = [...userLogins]
    const urls = []
    do {
      const params = new URLSearchParams( {
        language: 'es',
        game_id: '27471',
        first: '100'
      } )
      for ( let i = 0; i < 100 && logins.length > 0; i++ ) {
        params.append( 'user_login', logins.pop() as string )
      }
      urls.push( `streams?${ params }` )
    } while ( logins.length > 0 )
    return await this.getFullResponse( urls ) as Stream[] | null
  }

  async getFollowedChannels(): Promise<FollowedStream[] | null> {
    const cachedData = await this.getDataCache() as unknown as CachedData
    if ( cachedData.user_id ) {
      const params = new URLSearchParams( {
        user_id: cachedData.user_id,
        first: '100'
      } )
      return await this.getFullResponse( `streams/followed?${ params }` ) as FollowedStream[] | null
    }
    return null
  }

  protected async doRevoke( clientId: string, accessToken: string ): Promise<void> {
    try {
      await fetch(
        `${ OauthTwitchAPIClient.OAUTH_API_URL }/revoke`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams( {
            'client_id': clientId,
            'token': accessToken,
          } )
        }
      )
    } catch { return }
  }

  protected async getAuthorizationHeader(): Promise<HeadersInit> {
    return {
      'Client-ID': this.clientId,
      ... await super.getAuthorizationHeader()
    }
  }

  private async getFullResponse( url: string[] | string ): Promise<unknown[] | null> {
    const results: Map<string, unknown> = new Map()
    const finalUrls = Array.isArray( url ) ? url : [url]
    for ( const finalUrl of finalUrls ) {
      let paginationToken = ''
      do {
        let finalUrlWithParameters = finalUrl
        if ( paginationToken ) {
          finalUrlWithParameters += `&after=${ encodeURIComponent( paginationToken ) }`
        }
        const response = await this.authorizedFetch( `${ finalUrlWithParameters }` )
        if ( response.ok ) {
          const responseJson = await response.json()
          paginationToken = responseJson.pagination?.cursor ?? ''
          responseJson.data.forEach( ( i: {id: string} ) => { results.set( i['id'], i ) } )
        } else {
          return null
        }
      } while ( paginationToken !== '' )
    }
    return [...results.values()]
  }

  identifier(): string {
    return 'twitch'
  }

  protected authorizeUrl(): URL {
    return new URL( `${ OauthTwitchAPIClient.OAUTH_API_URL }/authorize` )
  }

  protected baseURL(): URL {
    return new URL( 'https://api.twitch.tv/helix' )
  }
}

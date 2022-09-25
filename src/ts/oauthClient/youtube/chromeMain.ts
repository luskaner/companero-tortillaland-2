import { CachedOauthData } from "../oauthClient";
import OauthYoutubeAPIClient from "./main";
import { Scope } from "./scope";

export default class OauthChromeYoutubeAPIClient extends OauthYoutubeAPIClient {
  constructor( scope?: Set<Scope> ) {
    super( '', scope )
  }

  private async getToken( interactive = true ): Promise<string | undefined> {
    try {
      return await new Promise<string>( resolve => chrome.identity.getAuthToken(
        {
          ...( ( this.scope?.size ?? 0 ) > 0 && { scopes: [...( this.scope as Set<string> )] } ),
          interactive
        },
        ( access_token ) => {
          resolve( access_token )
        }
      )
      )
    } catch {
      return undefined
    }
  }

  async authorize(interactive = true): Promise<boolean> {
    const authorized = await this.getToken(interactive) !== undefined
    if ( authorized && interactive) {
      await this.updateOauthCache( {
        connected: true
      } )
    }
    return authorized
  }

  protected async getOauthCache(): Promise<CachedOauthData> {
    const data = await super.getOauthCache()
    const connected = data.connected ?? false
    return {
      access_token: connected ? await this.getToken( false ) : undefined,
      connected
    }
  }

  protected async doRevoke( _: string, accessToken: string ): Promise<void> {
    await super.doRevoke( _, accessToken )
    await new Promise<void>( resolve => chrome.identity.removeCachedAuthToken( { token: accessToken }, () => { resolve() } ) )
  }
}

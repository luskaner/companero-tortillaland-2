import OauthTwitchAPIClient from "../../oauthClient/twitch/main";
import { Scope } from "../../oauthClient/twitch/scope";
import streamAdapter from "./streamAdapter/streamAdapter";
import TwitchStreamAdapter from "./streamAdapter/twitchStreamAdapter";
import { EnvType } from "../../types/env";
import BackgroundPlatform from "./BackgroundPlatform";
import Env from '/assets/data/env.json'
const env = Env as EnvType

export default class TwitchBackgroundPlatform extends BackgroundPlatform<OauthTwitchAPIClient, Scope> {
  async loadClient( scopes?: Set<Scope> | undefined ): Promise<OauthTwitchAPIClient> {
    const client = new OauthTwitchAPIClient( env.twitchClientId, scopes )
    await client.init()
    return client
  }
  identifier(): string {
    return 'twitch'
  }

  getStreamAdapter(): streamAdapter<OauthTwitchAPIClient> {
    return new TwitchStreamAdapter()
  }

  stringToScope( scopeStr: string ): Scope {
    return scopeStr as Scope
  }

}

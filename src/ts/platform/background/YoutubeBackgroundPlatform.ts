import OauthYoutubeAPIClient from "../../oauthClient/youtube/main";
import streamAdapter from "./streamAdapter/streamAdapter";
import YoutubeStreamAdapter from "./streamAdapter/youtubeStreamAdapter";
import BackgroundPlatform from "./BackgroundPlatform";
import { Scope } from "../../oauthClient/youtube/scope";
import { YoutubeEnvType } from "../../types/youtube.env";
import Env from '/assets/data/youtube.env.json'
const env = Env as YoutubeEnvType

export default class YoutubeBackgroundPlatform extends BackgroundPlatform<OauthYoutubeAPIClient, void> {
  async loadClient(): Promise<OauthYoutubeAPIClient> {
    return new OauthYoutubeAPIClient( env.youtubeClientId, new Set( [Scope.YOUTUBE_READONLY] ) )
  }

  identifier(): string {
    return 'youtube'
  }
  getStreamAdapter(): streamAdapter<OauthYoutubeAPIClient> {
    return new YoutubeStreamAdapter()
  }
}

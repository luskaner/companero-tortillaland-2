import { Scope } from "../../oauthClient/youtube/scope";
import OauthChromeYoutubeAPIClient from "../../oauthClient/youtube/chromeMain";
import YoutubeBackgroundPlatform from "./YoutubeBackgroundPlatform";

export default class ChromeYoutubeBackgroundPlatform extends YoutubeBackgroundPlatform {
  async loadClient(): Promise<OauthChromeYoutubeAPIClient> {
    return new OauthChromeYoutubeAPIClient( new Set( [Scope.YOUTUBE_READONLY] ) )
  }

}

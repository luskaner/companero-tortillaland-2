import BackgroundPlatform from "./BackgroundPlatform";
import PlatformList from "../PlatformList";
import TwitchBackgroundPlatform from "./TwitchBackgroundPlatform";
import YoutubeBackgroundPlatform from "../../compat/chromeStore/YoutubeBackgroundPlatformCompile";
import OauthClient from "../../oauthClient/oauthClient";
export default class TwitchYoutubeBackgroundPlatformList implements PlatformList<BackgroundPlatform<OauthClient, unknown>> {
  getPlatforms(): Set<BackgroundPlatform<OauthClient, unknown>> {
    return new Set( [new TwitchBackgroundPlatform(), new YoutubeBackgroundPlatform()] )
  }
}

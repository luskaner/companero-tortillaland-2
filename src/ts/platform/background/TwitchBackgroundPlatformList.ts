import BackgroundPlatform from "./BackgroundPlatform";
import PlatformList from "../PlatformList";
import TwitchBackgroundPlatform from "./TwitchBackgroundPlatform";
import OauthClient from "../../oauthClient/oauthClient";

export default class TwitchBackgroundPlatformList implements PlatformList<BackgroundPlatform<OauthClient, unknown>> {
  getPlatforms(): Set<BackgroundPlatform<OauthClient, unknown>> {
    return new Set( [new TwitchBackgroundPlatform()] )
  }
}

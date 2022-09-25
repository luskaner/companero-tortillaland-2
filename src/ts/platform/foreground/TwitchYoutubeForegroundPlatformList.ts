import ForegroundPlatform from "./ForegroundPlatform";
import PlatformList from "../PlatformList";
import TwitchForegroundPlatform from "./TwitchForegroundPlatform";
import YoutubeForegroundPlatform from "./YoutubeForegroundPlatform";
export default class TwitchYoutubeForegroundPlatformList implements PlatformList<ForegroundPlatform> {
  getPlatforms(): Set<ForegroundPlatform> {
    return new Set<ForegroundPlatform>( [new TwitchForegroundPlatform(), new YoutubeForegroundPlatform()] )
  }
}

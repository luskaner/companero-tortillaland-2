import ForegroundPlatform from "./ForegroundPlatform";
import PlatformList from "../PlatformList";
import TwitchForegroundPlatform from "./TwitchForegroundPlatform";
export default class TwitchForegroundPlatformList implements PlatformList<ForegroundPlatform> {
  getPlatforms(): Set<ForegroundPlatform> {
    return new Set<ForegroundPlatform>( [new TwitchForegroundPlatform()] )
  }
}

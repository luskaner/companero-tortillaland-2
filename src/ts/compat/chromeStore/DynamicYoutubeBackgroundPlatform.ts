import ChromeYoutubeBackgroundPlatform from "../../platform/background/ChromeYoutubeBackgroundPlatform";
import YoutubeBackgroundPlatform from "../../platform/background/YoutubeBackgroundPlatform";

let platform
if ( typeof chrome.identity.getAuthToken === 'function' ) {
  platform = ChromeYoutubeBackgroundPlatform
} else {
  // Added so other Chromium-based browsers using the Chrome Store can work
  platform = YoutubeBackgroundPlatform
}

export default platform

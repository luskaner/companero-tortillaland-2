import { Scope } from "../../oauthClient/twitch/scope";
import ForegroundPlatform from "./ForegroundPlatform";
import twitchButton from '/assets/images/app/twitchWordmarkWhite.svg';
import '/src/css/twitchButton.css'
export default class TwitchForegroundPlatform extends ForegroundPlatform {
  identifier(): string {
    return 'twitch'
  }
  title(): string {
    return 'Twitch'
  }
  connectDisconnectButtonInfo(): { buttonClassList?: string[]; logoImgSrc: string; logoAlt: string; } {
    return {
      buttonClassList: ['brand-button', 'twitch-button'],
      logoImgSrc: twitchButton,
      logoAlt: browser.i18n.getMessage( 'twitch_logo_alt' )
    }
  }
  permissionsLinkInfo(): { src: URL; text: string; } {
    return {
      src: new URL( 'https://www.twitch.tv/settings/connections' ),
      text: browser.i18n.getMessage( 'options_platform_disconnect_twitch_link_text' )
    }
  }
  scopeInfo(): { info?: string | undefined; scopes?: Record<string, string> | undefined; } {
    return {
      info: browser.i18n.getMessage( 'options_twitch_following_info' ),
      scopes: { [Scope.USER_READ_FOLLOWS]: browser.i18n.getMessage( 'options_twitch_read_followers' ) }
    }
  }
}

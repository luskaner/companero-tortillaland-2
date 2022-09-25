import ForegroundPlatform from "./ForegroundPlatform";
import youtubeButton from '/assets/images/app/ytLogoMonoDark.png';
import '/src/css/youtubeButton.css'

export default class YoutubeForegroundPlatform extends ForegroundPlatform {
  identifier(): string {
    return 'youtube'
  }
  title(): string {
    return 'Youtube'
  }
  connectDisconnectButtonInfo(): { buttonClassList?: string[]; logoImgSrc: string; logoAlt: string; } {
    return {
      buttonClassList: ['brand-button', 'youtube-button'],
      logoImgSrc: youtubeButton,
      logoAlt: browser.i18n.getMessage( 'youtube_logo_alt' )
    }
  }
  permissionsLinkInfo(): { src: URL; text: string; } {
    return {
      src: new URL( 'https://myaccount.google.com/permissions' ),
      text: browser.i18n.getMessage( 'options_platform_disconnect_youtube_link_text' )
    }
  }
}

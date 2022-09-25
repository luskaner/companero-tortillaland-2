import Identified from "../../Identified";

export default abstract class ForegroundPlatform implements Identified {
  scopeInfo(): {info?: string, scopes?: Record<string, string>} {
    return {}
  }

  abstract identifier(): string

  abstract title(): string

  abstract connectDisconnectButtonInfo(): { buttonClassList?: string[], logoImgSrc: string, logoAlt: string }

  abstract permissionsLinkInfo(): { src: URL, text: string }
}

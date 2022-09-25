import Identified from "../../Identified";
import OauthClient from "../../oauthClient/oauthClient";
import StreamAdapter from "./streamAdapter/streamAdapter";

export default abstract class BackgroundPlatform<client extends OauthClient, scope> implements Identified {
  abstract getStreamAdapter(): StreamAdapter<client>

  abstract identifier(): string

  abstract loadClient( scopes?: Set<scope> ): Promise<client>

  stringToScope( scopeStr: string ): scope {
    return scopeStr as scope
  }
}

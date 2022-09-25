import OauthTwitchAPIClient from "../../../oauthClient/twitch/main";
import { Scope } from "../../../oauthClient/twitch/scope";
import { User } from "../../../oauthClient/twitch/types";
import { ApiStream, PartialApiStream } from "../../../types/stream";
import StreamAdapter from "./streamAdapter";

export default class TwitchStreamAdapter extends StreamAdapter<OauthTwitchAPIClient> {
  private static broadcasterPriority = {
    partner: 2,
    affiliate: 1,
    '': 0
  }

  protected async doGetStreams( client: OauthTwitchAPIClient, channelIds: Set<string>, acceptStream?: ( baseStream: PartialApiStream ) => boolean ): Promise<Record<string, ApiStream>> {
    const apiStreams: Record<string, ApiStream> = {}
    const streams = await client.getStreams( channelIds )
    if ( streams ) {
      for ( const s of streams ) {
        const baseStream: PartialApiStream = {
          subtitle: s.title
        }
        if ( !acceptStream || acceptStream( baseStream ) ) {
          const apiStream = baseStream as ApiStream
          apiStream.title = s.user_name
          apiStream.viewers = s.viewer_count
          apiStream.url = `https://twitch.tv/${ s.user_login }`
          apiStreams[s.user_login] = apiStream
        }
      }
      if ( Object.keys( apiStreams ).length > 0 ) {
        const followedLogins: Set<string> = new Set()
        const scope = client.scopes as Set<Scope> | undefined
        if ( scope?.has( Scope.USER_READ_FOLLOWS ) ) {
          const followedChannels = await client.getFollowedChannels()
          if ( followedChannels && followedChannels.length > 0 ) {
            followedChannels.forEach( c => { followedLogins.add( c.user_login ) } )
          }
        }
        const userLoginsRecord: Record<string, User> = {};
        ( ( await client.getUsers( new Set( Object.keys( apiStreams ) ) ) ) as User[] ).forEach( u => { userLoginsRecord[u.login] = u } )
        for ( const [login, apiStream] of Object.entries( apiStreams ) ) {
          const u = userLoginsRecord[login]
          apiStream.imageUrl = u.profile_image_url
          apiStream.favourite = followedLogins.has( u.login )
          apiStream.priority = TwitchStreamAdapter.broadcasterPriority[u.broadcaster_type as keyof typeof TwitchStreamAdapter.broadcasterPriority]
        }
      }
    }
    return apiStreams
  }
}

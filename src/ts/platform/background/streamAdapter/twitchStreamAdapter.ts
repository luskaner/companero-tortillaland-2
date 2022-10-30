import Env from '/assets/data/env.json'
import { EnvType } from "../../../types/env";
import OauthTwitchAPIClient from "../../../oauthClient/twitch/main";
import { Scope } from "../../../oauthClient/twitch/scope";
import { User } from "../../../oauthClient/twitch/types";
import { ApiStream } from "../../../types/stream";
import StreamAdapter from "./streamAdapter";

const env = Env as EnvType

export default class TwitchStreamAdapter extends StreamAdapter<OauthTwitchAPIClient> {
  private static broadcasterPriority = {
    partner: 2,
    affiliate: 1,
    '': 0
  }

  protected async doGetStreams( client: OauthTwitchAPIClient, channelIds: Set<string> ): Promise<Record<string, ApiStream>> {
    const partialStreams: Record<string, { title: string, subtitle: string, viewers: number, url: string }> = {}
    const apiStreams: Record<string, ApiStream> = {}
    const streams = await client.getStreams( channelIds )
    if ( streams ) {
      for ( const s of streams ) {
        let acceptStream = s.title.toLocaleLowerCase().includes( 'tortill' )
        if ( !acceptStream ) {
          const tags = await this.getTags( s.user_login )
          acceptStream = [...tags].some( t => t.toLocaleLowerCase().includes( 'tortill' ) )
        }
        if ( acceptStream ) {
          partialStreams[s.user_login] = {
            title: s.user_name,
            subtitle: s.title,
            viewers: s.viewer_count,
            url: `https://twitch.tv/${ s.user_login }`
          }
        }
      }
      if ( Object.keys( partialStreams ).length > 0 ) {
        const followedLogins: Set<string> = new Set()
        const scope = client.scopes as Set<Scope> | undefined
        if ( scope?.has( Scope.USER_READ_FOLLOWS ) ) {
          const followedChannels = await client.getFollowedChannels()
          if ( followedChannels && followedChannels.length > 0 ) {
            followedChannels.forEach( c => { followedLogins.add( c.user_login ) } )
          }
        }
        const userLoginsRecord: Record<string, User> = {};
        ( ( await client.getUsers( new Set( Object.keys( partialStreams ) ) ) ) as User[] ).forEach( u => { userLoginsRecord[u.login] = u } )
        for ( const [login, partialStream] of Object.entries( partialStreams ) ) {
          const u = userLoginsRecord[login]
          apiStreams[login] = {
            ...partialStream,
            imageUrl: u.profile_image_url,
            favourite: followedLogins.has( login ),
            priority: TwitchStreamAdapter.broadcasterPriority[u.broadcaster_type]
          }
        }
      }
    }
    return apiStreams
  }

  private async getTags( channelId: string ): Promise<Set<string>> {
    let tags: string[] = []
    try {
      const response = await fetch(
        'https://gql.twitch.tv/gql',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Client-Id': env.twitchGraphQlClientId
          },
          body: JSON.stringify(
            [{
              operationName: 'StreamTagsTrackingChannel',
              variables: {
                channel: channelId
              },
              extensions: {
                persistedQuery: {
                  version: 1,
                  sha256Hash: '6aa3851aaaf88c320d514eb173563d430b28ed70fdaaf7eeef6ed4b812f48608'
                }
              }
            }] )
        }
      )
      if ( response.ok ) {
        const json = await response.json()
        tags = ( json[0]?.data?.user?.stream?.freeformTags ?? [] ).map( ( t: { name: string } ) => t.name )
      }

      // eslint-disable-next-line no-empty
    } catch { }
    return new Set( tags )
  }
}

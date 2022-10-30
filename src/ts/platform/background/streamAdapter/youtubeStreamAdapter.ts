import OauthYoutubeAPIClient from "../../../oauthClient/youtube/main";
import { ApiStream } from "../../../types/stream";
import StreamAdapter from "./streamAdapter";

export default class YoutubeStreamAdapter extends StreamAdapter<OauthYoutubeAPIClient> {
  protected async doGetStreams( client: OauthYoutubeAPIClient, channelIds: Set<string> ) {
    const partialStreams: Record<string, { subtitle: string, viewers: number, url: string }> = {}
    const apiStreams: Record<string, ApiStream> = {}
    const streams = await client.getStreams( channelIds )
    if ( Object.keys( streams ).length > 0 ) {
      const videos = await client.getVideos( new Set( Object.values( streams ) ) )
      Object.keys( streams ).forEach( channelId => {
        const videoId = streams[channelId]
        const video = videos[videoId]
        if ( video.title.toLocaleLowerCase().includes( 'tortill' ) ) {
          partialStreams[channelId] = {
            subtitle: video.title,
            url: `https://www.youtube.com/watch?v=${ videoId }`,
            viewers: video.viewers,
          }
        }
      } )

      if ( Object.keys( partialStreams ).length > 0 ) {
        const users = await client.getUsers( new Set( Object.keys( partialStreams ) ) )
        const followedChannels = await client.getSubscribedChannels()
        for ( const [channelId, partialStream] of Object.entries( partialStreams ) ) {
          const user = users[channelId]
          apiStreams[channelId] = {
            ...partialStream,
            favourite: followedChannels.has( channelId ),
            imageUrl: user.profileImage.toString(),
            title: user.name
          }
        }
      }
    }

    return apiStreams
  }

  protected cacheMinutes(): number {
    return 15
  }
}

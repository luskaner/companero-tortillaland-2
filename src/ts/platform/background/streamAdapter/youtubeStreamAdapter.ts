import OauthYoutubeAPIClient from "../../../oauthClient/youtube/main";
import { ApiStream, PartialApiStream } from "../../../types/stream";
import StreamAdapter from "./streamAdapter";

export default class YoutubeStreamAdapter extends StreamAdapter<OauthYoutubeAPIClient> {
  protected async doGetStreams( client: OauthYoutubeAPIClient, channelIds: Set<string>, acceptStream?: ( baseStream: PartialApiStream ) => boolean ) {
    const apiStreams: Record<string, ApiStream> = {}
    const streams = await client.getStreams( channelIds )
    if ( Object.keys( streams ).length > 0 ) {
      const videos = await client.getVideos( new Set( Object.values( streams ) ) )
      Object.keys( streams ).forEach( channelId => {
        const videoId = streams[channelId]
        const video = videos[videoId]
        const baseStream: PartialApiStream = {
          subtitle: video.title
        }
        if ( !acceptStream || acceptStream( baseStream ) ) {
          const apiStream = baseStream as ApiStream
          apiStream.url = `https://www.youtube.com/watch?v=${ videoId }`
          apiStream.viewers = video.viewers
          apiStreams[channelId] = apiStream
        }
      } )

      if ( Object.keys( apiStreams ).length > 0 ) {
        const users = await client.getUsers( new Set(Object.keys( apiStreams )) )
        const followedChannels = await client.getSubscribedChannels()
        Object.entries( apiStreams ).forEach( apiStreamEntry => {
          const [channelId, apiStream] = apiStreamEntry
          const user = users[channelId]
          apiStream.favourite = followedChannels.has( channelId )
          apiStream.imageUrl = user.profileImage.toString()
          apiStream.title = user.name
        } )
      }
    }

    return apiStreams
  }

  protected cacheMinutes(): number {
    return 15
  }
}

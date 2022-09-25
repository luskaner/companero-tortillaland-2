import OauthClient from "../oauthClient"
import { Scope } from "./scope"
import { User, Video } from "./types"

export default class OauthYoutubeAPIClient extends OauthClient {
  private static readonly OAUTH_API_URL = new URL( 'https://accounts.google.com/o/oauth2' )

  constructor( clientId: string, scope?: Set<Scope> ) {
    super( clientId, scope )
  }

  protected async validate( accessToken: string ): Promise<boolean> {
    const response = await fetch( 'https://www.googleapis.com/oauth2/v1/tokeninfo?' + new URLSearchParams( { 'access_token': accessToken } ) )
    await this.handleResponseCode( response.status )
    return response.ok
  }

  async getUsers( channelIds: Set<string> ): Promise<Record<string, User>> {
    const response: Record<string, User> = {}
    const params = new URLSearchParams( {
      part: "snippet",
      fields: "items(snippet(title,thumbnails/default/url))"
    } )
    const channelIdsList = [...channelIds]
    channelIdsList.forEach( id => params.append( 'id', id ) )
    const resp = await this.authorizedFetch( `channels?${ params }` )
    if ( resp.ok ) {
      const responseJson = await resp.json()
      responseJson.items.forEach( ( i: { snippet: { title: string, thumbnails: { default: { url: string } } } }, index: number ) => { response[channelIdsList[index]] = { name: i.snippet.title, profileImage: new URL( i.snippet.thumbnails.default.url ) } } )
    }
    return response
  }

  async getStreams( channelIds: Set<string> ): Promise<Record<string, string>> {
    const responses: Record<string, string> = {}
    for ( const channelId of channelIds ) {
      const params = new URLSearchParams( {
        channelId: channelId,
        eventType: "live",
        maxResults: "1",
        safeSearch: "none",
        type: "video",
        part: "id",
        fields: "items(id/videoId)"
      } )
      const resp = await this.authorizedFetch( `search?${ params }` )
      if ( resp.ok ) {
        const responseJson = await resp.json()
        responseJson.items.forEach( ( i: { id: { videoId: string } } ) => { responses[channelId] = i.id.videoId } )
      }
    }
    return responses
  }

  async getVideos( videoIds: Set<string> ): Promise<Record<string, Video>> {
    const response: Record<string, Video> = {}
    const params = new URLSearchParams( {
      fields: "items(snippet/title,liveStreamingDetails/concurrentViewers)",
    } )
    params.append( 'part', 'snippet' )
    params.append( 'part', 'liveStreamingDetails' )
    const videoIdsList = [...videoIds]
    videoIdsList.forEach( id => params.append( 'id', id ) )
    const resp = await this.authorizedFetch( `videos?${ params }` )
    if ( resp.ok ) {
      const responseJson = await resp.json()
      responseJson.items.forEach( ( i: { snippet: { title: string }, liveStreamingDetails: { concurrentViewers: string } }, index: number ) => { response[videoIdsList[index]] = { title: i.snippet.title, viewers: parseInt( i.liveStreamingDetails.concurrentViewers ) } } )
    }
    return response
  }

  async getSubscribedChannels(): Promise<Set<string>> {
    const response = new Set<string>()
    let responseJson = null
    do {
      const params: URLSearchParams = new URLSearchParams( {
        part: "snippet",
        mine: "true",
        maxResults: "50",
        fields: "items(snippet/resourceId/channelId)",
        ...( responseJson !== null && { pageToken: responseJson.nextPageToken } )
      } )
      const resp = await this.authorizedFetch( `subscriptions?${ params }` )
      if ( resp.ok ) {
        responseJson = await resp.json()
        responseJson.items.forEach( ( i: {snippet: {resourceId: {channelId: string}}} ) => { response.add( i.snippet.resourceId.channelId ) } )
      } else {
        break
      }
    } while ( 'nextPageToken' in responseJson )
    return response
  }

  protected async doRevoke( _: string, accessToken: string ): Promise<void> {
    try {
      await fetch(
        `${ OauthYoutubeAPIClient.OAUTH_API_URL }/revoke?` + new URLSearchParams( { 'access_token': accessToken } ),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      )
    } catch { return }
  }

  identifier(): string {
    return 'youtube'
  }

  protected authorizeUrl(): URL {
    return new URL( `${ OauthYoutubeAPIClient.OAUTH_API_URL }/auth` )
  }

  protected baseURL(): URL {
    return new URL( 'https://www.googleapis.com/youtube/v3' )
  }
}

import OauthClient from "../../../oauthClient/oauthClient";
import { ApiStream } from "../../../types/stream";

export type CachedStream = {
  time: number,
  data: Record<string, ApiStream>
}
export default abstract class StreamAdapter<Client extends OauthClient> {

  protected abstract doGetStreams( client: Client, channelIds: Set<string> ): Promise<Record<string, ApiStream>>

  async getStreams( client: Client, channelIds: Set<string> ): Promise<Record<string, ApiStream>> {
    const cacheMinutes = this.cacheMinutes()
    if ( cacheMinutes > 0 ) {
      const data = await client.getDataCache()
      const currentDate = Date.now()
      if ( 'streams' in data && currentDate - (data.streams as CachedStream).time < cacheMinutes * 60 * 1000 ) {
        const apiStreams = await this.doGetStreams( client, channelIds )
        const data = await client.getDataCache()
        data.streams = {
          time: currentDate,
          data: apiStreams
        }
        await client.updateDataCache( data )
        return apiStreams
      }
    }
    return this.doGetStreams( client, channelIds )
  }

  protected cacheMinutes(): number {
    return 0
  }
}

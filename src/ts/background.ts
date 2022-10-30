import Data from '/assets/data/data.json'

import { ApiStream, EnrichedStream, IslandType } from './types/stream'
import { DataType } from './types/data'
import { ConnectDisconnectResponse, ConnectMessage, DisconnectMessage, Message, Response, StatusResponse } from './types/messaging'
import PlatformList from './platform/background/BackgroundPlatformListCompile'
import BackgroundPlatform from './platform/background/BackgroundPlatform'
import OauthClient from './oauthClient/oauthClient'

const data = Data as DataType

async function getStreams(): Promise<void> {
  const streams = await getAllStreams()
  await browser.action.setBadgeText( { text: streams.length.toString() } )
  await browser.storage.local.set( { streams } )
}

async function goToLogoutState() {
  await removeAlarms()
  const manifest = browser.runtime.getManifest()
  await browser.action.setPopup( { popup: ( manifest.action as browser._manifest.ActionManifest ).default_popup as string } )
  await browser.action.setBadgeText( { text: '' } )
}

async function validate(): Promise<void> {
  let nonValid = 0
  const platformList = new PlatformList().getPlatforms()
  platformList.forEach( async platform => {
    const client = await platform.loadClient() as OauthClient
    if ( !await client.ensureAuthorized() ) {
      await client.revoke()
      nonValid++
    }
  } )
  if ( platformList.size == nonValid ) {
    await goToLogoutState()
  }
}

async function getAllStreams(): Promise<EnrichedStream[]> {
  const channelIds: Record<string, Set<string>> = {}
  const islands: Record<string, IslandType> = {}

  data.channels.forEach( channel => {
    const channelSplit = channel.split( ':' )
    const channelType = channelSplit[0]
    const channelIdentifier = channelSplit[1]
    if ( !( channelType in channelIds ) ) {
      channelIds[channelType] = new Set()
    }
    channelIds[channelType].add( channelIdentifier )
  } )

  for ( const [island, channelIds] of Object.entries( data.islands ) ) {
    channelIds.forEach( channelId => {
      islands[channelId] = IslandType[island as keyof typeof IslandType]
    } )
  }

  const streams: EnrichedStream[] = []

  for ( const platform of new PlatformList().getPlatforms() ) {
    const identifier = platform.identifier()
    if ( identifier in channelIds ) {
      const client = await platform.loadClient() as OauthClient
      if ( await client.connected() ) {
        const apiStreams = await platform.getStreamAdapter().getStreams(
          client,
          channelIds[identifier],
        ) as Record<string, ApiStream>
        for ( const [channel, apiStream] of Object.entries( apiStreams ) ) {
          streams.push( {
            island: islands[channel],
            ...apiStream
          } )
        }
      }
    }
  }

  return streams.sort( ( a, b ) => {
    return Number( b.favourite ) - Number( a.favourite ) ||
      b.viewers - a.viewers ||
      ( b.priority ?? 0 ) - ( a.priority ?? 0 ) ||
      a.title.localeCompare( b.title )
  } )
}

async function alarmListener( alarm: browser.alarms.Alarm ) {
  switch ( alarm.name ) {
    case 'GET_STREAMS':
      await getStreams()
      break
    case 'VALIDATE':
      await validate()
      break
  }
}

async function createAlarms() {
  for ( const [name, time] of Object.entries( data.timers ) ) {
    browser.alarms.create( name, { periodInMinutes: time as number } )
  }
}

async function removeAlarms() {
  for ( const name of Object.keys( data.timers ) ) {
    browser.alarms.clear( name )
  }
}

async function disconnected() {
  let disconnected = 0
  const platformList = new PlatformList().getPlatforms()
  for ( const platform of platformList ) {
    const client = await platform.loadClient() as OauthClient
    if ( ! await client.connected() ) {
      disconnected++
    }
  }

  return disconnected === platformList.size
}

async function setUp( includeAlarms = true ) {
  browser.action.setPopup( { popup: '/html/popup/main.html' } )
  if ( includeAlarms ) {
    await createAlarms()
  }
  await getStreams()
}

function getPlatform( identifier: string ): BackgroundPlatform<OauthClient, unknown> {
  return [...new PlatformList().getPlatforms()].find( p => p.identifier() === identifier ) as BackgroundPlatform<OauthClient, unknown>
}

async function connect( message: ConnectMessage, sendResponse: ( response: ConnectDisconnectResponse ) => void ) {
  let scopeSet: Set<unknown> | undefined = undefined
  const platform = getPlatform( message.platform )
  if ( message.scopes ) {
    scopeSet = new Set()
    message.scopes.forEach( s => { ( scopeSet as Set<unknown> ).add( platform.stringToScope( s ) ) } )
  }
  const client = await getPlatform( message.platform ).loadClient( scopeSet ) as OauthClient
  const previousState = await disconnected()
  const authorized = await client.authorize()
  let success = false
  if ( authorized ) {
    if ( previousState !== await disconnected() ) {
      await setUp()
    } else {
      await getAllStreams()
    }
    success = true
  }
  sendResponse( success )
  dispatchEvent( new CustomEvent( 'connectResponse', { detail: { success } } ) )
}

async function disconnect( message: DisconnectMessage, sendResponse: ( response: ConnectDisconnectResponse ) => void ) {
  await ( await getPlatform( message.platform ).loadClient() ).revoke()
  if ( await disconnected() ) {
    await goToLogoutState()
  }
  sendResponse( true )
}

async function status( sendResponse: ( response: StatusResponse ) => void ) {
  const data: StatusResponse = {}
  for ( const platform of new PlatformList().getPlatforms() ) {
    const client = await platform.loadClient() as OauthClient
    data[platform.identifier()] = {
      connected: await client.connected(),
      scopes: client.scopes ? [...client.scopes] : undefined
    }
  }
  sendResponse( data as StatusResponse )
}

function messageListener( message: Message, _: browser.runtime.MessageSender, sendResponse: ( response: Response ) => void ) {
  ( async () => {
    switch ( message.type ) {
      case "connect":
        await connect( message, sendResponse )
        break
      case "disconnect":
        await disconnect( message, sendResponse )
        break
      case "status":
        await status( sendResponse )
        break;
    }
  } )();
  return true;
}



if ( !await disconnected() ) {
  await setUp()
}

browser.runtime.onMessage.addListener( messageListener )
browser.alarms.onAlarm.addListener( alarmListener )

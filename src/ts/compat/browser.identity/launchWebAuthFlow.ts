import browserWindowsCreate from '../chromium/browser.windows.create'
import browserTabsCreate from '../chromium/browser.tabs.create'
import browserTabsRemove from '../chromium/browser.tabs.remove'

export default async function launchWebAuthFlow( details: browser.identity._LaunchWebAuthFlowDetails ): Promise<string> {
  const isChromium = !!globalThis.chrome
  const tabsRemove = isChromium ? browserTabsRemove : globalThis.browser.tabs.remove
  const namespace = isChromium ? globalThis.chrome : globalThis.browser
  return new Promise<string>( ( resolve, reject ) => {
    ( async () => {
      let tabId: number | undefined = undefined;
      const redirectURLOrigin = new URL( new URL( details.url ).searchParams.get( 'redirect_uri' ) as string ).origin
      let responseUrl: string | undefined = undefined
      const tabsOnUpdated = async ( _: number, changeInfo: browser.tabs._OnUpdatedChangeInfo, tab: browser.tabs.Tab ) => {
        responseUrl = ( tab as chrome.tabs.Tab ).pendingUrl || changeInfo.url || responseUrl
        if ( responseUrl && new URL( responseUrl ).origin === redirectURLOrigin ) {
          tabId = tab.id
          try {
            await tabsRemove( tabId as number )
            // eslint-disable-next-line no-empty
          } catch { }
        }

      }
      const tabsOnRemoved = ( removedTabId: number ) => {
        if ( tabId === removedTabId ) {
          namespace.tabs.onUpdated.removeListener( tabsOnUpdated as never )
          namespace.tabs.onRemoved.removeListener( tabsOnRemoved )
          if ( responseUrl ) {
            resolve( responseUrl )
          } else {
            reject( "Could not authorize" )
          }
        }
      }
      namespace.tabs.onUpdated.addListener( tabsOnUpdated as never )
      namespace.tabs.onRemoved.addListener( tabsOnRemoved )

      if ( ( namespace as { windows?: { create?: unknown } } ).windows?.create ) {
        const windowsCreate = isChromium ? browserWindowsCreate : globalThis.browser.windows.create
        const window = await windowsCreate( {
          ...( globalThis.browser && { allowScriptsToClose: true } ),
          type: "panel",
          url: details.url,
          focused: details.interactive,
          state: details.interactive ? "normal" : "minimized"
        } )
        tabId = window.tabs?.[0].id
      } else {
        const tabsCreate = isChromium ? browserTabsCreate : globalThis.browser.tabs.create
        const tab = await tabsCreate( {
          url: details.url,
          active: details.interactive,
        } )
        tabId = tab.id
      }
      if ( tabId === undefined ) {
        namespace.tabs.onUpdated.removeListener( tabsOnUpdated as never )
        namespace.tabs.onRemoved.removeListener( tabsOnRemoved )
        reject( "Could not create window nor tab" )
      }
    } )()
  } )
}

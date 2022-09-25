import launchWebAuthFlowCompat from '../browser.identity/launchWebAuthFlow'

export default async function launchWebAuthFlow( details: browser.identity._LaunchWebAuthFlowDetails ): Promise<string> {
  if ( details.interactive ) {
    const manifest = browser.runtime.getManifest()
    if ( manifest.options_ui ) {
      const optionsUrl = browser.runtime.getURL( manifest.options_ui.page )
      const optionsPage = browser.extension.getViews().find( w => w.location.href === optionsUrl )
      if ( optionsPage ) {
        return new Promise<string>( ( resolve, reject ) => {
          const redirectURLOrigin = new URL( new URL( details.url ).searchParams.get( 'redirect_uri' ) as string ).origin
          let tabId: number | undefined = undefined;

          const cleanUp = () => {
            browser.tabs.onUpdated.removeListener( tabsOnUpdated as never )
            browser.tabs.onRemoved.removeListener( tabsOnRemoved )
            removeEventListener( 'connectResponse', connectResponse )
          }

          const tabsOnUpdated = async ( currentTabId: number, changeInfo: browser.tabs._OnUpdatedChangeInfo ) => {
            if ( changeInfo.url && new URL( changeInfo.url ).origin === redirectURLOrigin ) {
              tabId = currentTabId
              resolve( changeInfo.url )
            }
          }

          const tabsOnRemoved = async ( removedTabId: number ) => {
            if ( tabId === removedTabId ) {
              reject( "Could not authorize" )
            }
          }

          const connectResponse = async () => {
            cleanUp()
            if ( tabId ) {
              try {
                await browser.tabs.update( tabId, { url: optionsUrl } )
              } catch {
                await globalThis.browser.runtime.openOptionsPage()
              }
            } else {
              await globalThis.browser.runtime.openOptionsPage()
            }
          }

          addEventListener( 'connectResponse', connectResponse );
          browser.tabs.onUpdated.addListener( tabsOnUpdated as never )
          browser.tabs.onRemoved.addListener( tabsOnRemoved )
          optionsPage.location.href = details.url
        } )
      }
    }
  }

  return launchWebAuthFlowCompat( details )
}

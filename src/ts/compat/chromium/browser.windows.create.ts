import promisify from "./promisify";

export default async function create( createData?: browser.windows._CreateCreateData | undefined ): Promise<browser.windows.Window> {
  if ( globalThis.browser?.windows?.create ) {
    return await globalThis.browser?.windows?.create( createData )
  } else {
    return await ( createData ? promisify( { fn: chrome.windows.create, args: [createData as chrome.windows.CreateData] } ) : promisify( { fnNoArgs: chrome.windows.create } ) ) as unknown as browser.windows.Window
  }
}

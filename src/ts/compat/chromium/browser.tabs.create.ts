import promisify from "./promisify"

export default async function create( createData: browser.tabs._CreateCreateProperties ): Promise<browser.tabs.Tab> {
  return await globalThis.browser?.tabs?.create( createData ) ?? promisify({fn: chrome.tabs.create, args: [createData]})
}

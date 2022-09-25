import promisify from "./promisify";

export default async function remove( tabId: number ): Promise<void> {
  return await globalThis.browser?.tabs?.remove( tabId ) as never ?? promisify<number, void>({fnNoRes: chrome.tabs.remove, args: [tabId]})
}

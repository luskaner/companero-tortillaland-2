import promisify from "./promisify"

export default async function launchWebAuthFlow( details: browser.identity._LaunchWebAuthFlowDetails ): Promise<string> {
  return await promisify( { fn: chrome.identity.launchWebAuthFlow, args: [details] } ) as string
}

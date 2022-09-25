export default function getManifest(): browser._manifest.WebExtensionManifest {
  // Using "globalThis" avoids this being replaced too
  const manifest = globalThis.browser.runtime.getManifest()
  manifest.manifest_version = 3
  manifest.action = manifest.browser_action
  delete manifest.browser_action
  manifest.background = {
    service_worker: ( manifest.background as { scripts: string[] } ).scripts[0],
    type: 'module'
  } as never
  if ( manifest.permissions ) {
    const host_permissions = manifest.permissions.filter( p => p.startsWith( 'https://' ) )
    if ( host_permissions.length > 0 ) {
      manifest.host_permissions = host_permissions
      manifest.permissions = manifest.permissions.filter( p => !host_permissions.includes( p ) )
    }
  }
  return manifest
}

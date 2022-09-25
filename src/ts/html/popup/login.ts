import internationalize from '../../i18n/main';
import '/src/css/common.css'
import '/src/css/popup/login.css'

addEventListener( 'DOMContentLoaded', () => {
  const div = document.querySelector('div') as HTMLDivElement
  const loginInfo = browser.i18n.getMessage( 'login_info' )
  const loginInfoMatch = loginInfo.match( /(?<pre>.+)??(?<link>{link})(?<post>.+)?/ )
  if ( loginInfoMatch?.groups ) {
    const { pre, link, post } = loginInfoMatch.groups;
    if ( pre ) {
      div.appendChild( document.createTextNode( pre ) )
    }
    if ( link ) {
      const a = document.createElement( 'a' )
      a.href = '#'
      a.title = 'opciones'
      a.textContent = a.title
      a.onclick = async () => { await browser.runtime.openOptionsPage() }
      div.appendChild( a )
    }
    if ( post ) {
      div.appendChild( document.createTextNode( post ) )
    }
  } else {
    div.appendChild( document.createTextNode( loginInfo ) )
  }
  internationalize()
} );

import '/src/css/common.css'
import '/src/css/checkbox.css'
import '/src/css/options/main.css'
import internationalize from '../../i18n/main'
import { Message, ActionMessage, StatusMessage, Response, StatusResponse } from '../../types/messaging'
import PlatformList from '../../platform/foreground/ForegroundPlatformListCompile'

async function sendMessageRetry<response extends Response>( message: Message ): Promise<response | undefined> {
  let tries = 0
  do {
    try {
      return await browser.runtime.sendMessage( message )
    } catch {
      await new Promise( resolve => setTimeout( resolve, 1000 ) );
      tries++
    }
  } while ( tries < 10 )
}

function disableNavigation( this: GlobalEventHandlers ) {
  return false;
}

function updateDOM( form: HTMLFormElement, type: string, scopes?: string[] ) {
  const changeElements = form.getElementsByClassName( 'only-connected' )
  const displayMode = type === 'connect' ? '' : 'none'
  for ( const element of changeElements ) {
    ( element as HTMLElement ).style.display = displayMode
  }
  const typeInput = form.querySelector( 'input[name="type"]' ) as HTMLInputElement
  typeInput.value = type === 'connect' ? 'disconnect' : 'connect'
  const buttonText = form.querySelector( '.button-text' ) as HTMLSpanElement
  buttonText.textContent = type === 'connect' ? browser.i18n.getMessage( 'options_disconnect_of' ) : browser.i18n.getMessage( 'options_connect_with' )
  const scopeInputs = form.querySelectorAll( 'label.scope > input' ) as NodeListOf<HTMLInputElement>
  for ( const scopeInput of scopeInputs ) {
    scopeInput.disabled = type === 'connect'
    if ( type === 'disconnect' ) {
      scopeInput.checked = false
    } else if ( scopes?.includes( scopeInput.name ) ) {
      scopeInput.checked = true
    }
  }
}

async function onSubmit( ev: SubmitEvent ) {
  const form = ev.target as HTMLFormElement
  const submitButton = form.querySelector( 'button[type="submit"]' ) as HTMLButtonElement
  submitButton.disabled = true
  const data = new FormData( form )
  const platform = ( data.get( 'platform' ) as FormDataEntryValue ).toString() as ActionMessage["platform"]
  const type = ( data.get( 'type' ) as FormDataEntryValue ).toString() as ActionMessage["type"]
  const scopeInputs = form.querySelectorAll( 'label.scope > input' ) as NodeListOf<HTMLInputElement>
  let scopes: string[] | undefined = undefined
  if ( scopeInputs.length > 0 ) {
    scopes = []
    for ( const scopeInput of scopeInputs ) {
      if ( scopeInput.checked ) {
        scopes.push( scopeInput.name )
      }
    }
  }
  const success = await sendMessageRetry( { type, platform, scopes } as ActionMessage )
  if ( success ) {
    updateDOM( form, type )
  }
  submitButton.disabled = false
}

function initializeDom() {
  const baseTemplate = ( document.getElementById( 'platformBase' ) as HTMLTemplateElement ).content
  const scopeInfoTemplate = ( document.getElementById( 'platformScopeInfo' ) as HTMLTemplateElement ).content
  const scopeCheckboxTemplate = ( document.getElementById( 'platformScopeCheckbox' ) as HTMLTemplateElement ).content
  const endTemplate = ( document.getElementById( 'platformEnd' ) as HTMLTemplateElement ).content
  const optionsTitle = document.getElementById( 'optionsTitle' ) as HTMLElement

  for ( const platform of new PlatformList().getPlatforms() ) {
    const base = baseTemplate.cloneNode( true ) as DocumentFragment
    const buttonInfo = platform.connectDisconnectButtonInfo()
    const scopeInfo = platform.scopeInfo()
    const permissionInfo = platform.permissionsLinkInfo();
    ( base.querySelector( 'h2' ) as HTMLHeadingElement ).textContent = platform.title()
    if ( buttonInfo.buttonClassList ) {
      ( base.querySelector( 'button' ) as HTMLButtonElement ).classList.add( ...buttonInfo.buttonClassList )
    }
    const form = base.querySelector( 'form' ) as HTMLFormElement
    const img = form.querySelector( 'img' ) as HTMLImageElement
    img.src = buttonInfo.logoImgSrc
    img.alt = buttonInfo.logoAlt

    if ( scopeInfo.scopes ) {
      if ( scopeInfo.info ) {
        const scopeInfoHtml = scopeInfoTemplate.cloneNode( true ) as DocumentFragment
        ( scopeInfoHtml.querySelector( 'span' ) as HTMLSpanElement ).textContent = scopeInfo.info
        form.appendChild( scopeInfoHtml )
      }
      for ( const [scopeValue, scopeName] of Object.entries( scopeInfo.scopes ) ) {
        const scopeCheckbox = scopeCheckboxTemplate.cloneNode( true ) as DocumentFragment
        ( scopeCheckbox.querySelector( 'input' ) as HTMLInputElement ).name = scopeValue;
        ( scopeCheckbox.querySelector( 'span' ) as HTMLSpanElement ).textContent = scopeName
        form.appendChild( scopeCheckbox )
      }
    }

    const end = endTemplate.cloneNode( true ) as DocumentFragment
    const connectedInfoSpanLink = end.querySelector( 'a' ) as HTMLAnchorElement
    connectedInfoSpanLink.href = permissionInfo.src.toString()
    connectedInfoSpanLink.textContent = permissionInfo.text;
    ( end.querySelector( 'input[name="platform"]' ) as HTMLInputElement ).value = platform.identifier()
    form.appendChild( end )
    document.body.insertBefore( base, optionsTitle )
  }
}

addEventListener( 'DOMContentLoaded', async () => {
  initializeDom()
  internationalize()
  const forms = document.getElementsByTagName( 'form' )
  for ( const form of forms ) {
    form.onsubmit = disableNavigation
    form.addEventListener( 'submit', onSubmit )
  }

  const status = await sendMessageRetry<StatusResponse>( { type: 'status' } as StatusMessage )
  if ( status !== undefined ) {
    for ( const identifier of Object.keys( status ) ) {
      const singleStatus = status[identifier]
      if ( singleStatus.connected ) {
        updateDOM( ( document.querySelector( `form input[value="${ identifier }"]` ) as HTMLInputElement ).parentElement as HTMLFormElement, 'connect', singleStatus.scopes )
      }
    }

    const loaders = document.getElementsByClassName( 'loader' )
    for ( const loader of loaders ) {
      ( loader as HTMLDivElement ).style.display = 'none'
    }
    for ( const form of forms ) {
      form.style.removeProperty( 'display' );
    }
  }
} );

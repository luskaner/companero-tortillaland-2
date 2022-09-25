export default function internationalize() {
  const elementsLocale = document.querySelectorAll( '[data-locale]' )
  for ( const element of elementsLocale ) {
    element.textContent = browser.i18n.getMessage( element.getAttribute( 'data-locale' ) as string )
    element.removeAttribute('data-locale')
  }
  const elementsLocaleAttributes = document.querySelectorAll( '[data-locale-attrs]' )
  for ( const element of elementsLocaleAttributes ) {
    const matching = JSON.parse(element.getAttribute( 'data-locale-attrs' ) as string)
    for (const [attr, value] of Object.entries(matching)) {
      element.setAttribute(attr, browser.i18n.getMessage(value as string))
    }
    element.removeAttribute('data-locale-attrs')
  }
}

import '/src/css/common.css'
import '/src/css/checkbox.css'
import '/src/css/popup/main.css'
import Data from '/assets/data/data.json'
import internationalize from '../../i18n/main'
import { IslandType, EnrichedStream } from "../../types/stream"
import { DataType } from '../../types/data'

const data = Data as DataType

let visibleElements = 0
let streams: EnrichedStream[]
let islands: Set<IslandType> | undefined = undefined

function createStreamElement( stream: EnrichedStream ) {
  const baseElement = ( ( document.getElementById( 'channel' ) as HTMLTemplateElement ).content.cloneNode( true ) as DocumentFragment ).querySelector( 'div' ) as HTMLDivElement
  updateStreamElement( baseElement, stream )
  return baseElement
}

function updateStreamElement( element: HTMLDivElement, stream: EnrichedStream ) {
  if ( stream.island === IslandType.GREEN ) {
    if ( element.classList.contains( 'orange-island' ) ) {
      element.classList.remove( 'orange-island' )
    }
    if ( !element.classList.contains( 'green-island' ) ) {
      element.classList.add( 'green-island' )
    }
  } else if ( stream.island === IslandType.ORANGE ) {
    if ( element.classList.contains( 'green-island' ) ) {
      element.classList.remove( 'green-island' )
    }
    if ( !element.classList.contains( 'orange-island' ) ) {
      element.classList.add( 'orange-island' )
    }
  }

  const link = element.querySelector( ':scope > a' ) as HTMLAnchorElement
  const parts = element.querySelectorAll( ':scope > a > div > div' )

  link.href = stream.url.toString()
  link.title = stream.subtitle

  const img = parts[0].getElementsByTagName( 'img' )[0] as HTMLImageElement
  img.src = stream.imageUrl.toString()
  img.alt = stream.title

  const titleSpan = parts[1].querySelector( ':scope > span:nth-of-type(1)' ) as HTMLSpanElement
  const favouriteIcon = parts[1].querySelector( 'img' ) as HTMLImageElement
  favouriteIcon.style.display = stream.favourite ? '' : 'none'
  titleSpan.textContent = stream.title

  const subtitleSpan = parts[1].querySelector( ':scope > span:nth-of-type(2)' ) as HTMLSpanElement
  subtitleSpan.textContent = stream.subtitle

  const formattedViewers = formatNumber( stream.viewers )
  const viewerCountSpan = parts[2].querySelector( ':scope > span' ) as HTMLSpanElement
  viewerCountSpan.textContent = formattedViewers

  if ( element.style.getPropertyValue( 'display' ) !== '' ) { element.style.removeProperty( 'display' ) }
}

function computeSelectedStreams(): EnrichedStream[] {
  return islands === undefined ? streams : streams.filter( s => ( islands as Set<IslandType> ).has( s.island ) )
}

function updateList( selectedStreams: EnrichedStream[] ) {
  const list = document.getElementById( 'players-streams' ) as HTMLDivElement
  const currentElements: NodeListOf<HTMLDivElement> = list.querySelectorAll( ':scope > div' )
  const updateI = Math.min( currentElements.length, selectedStreams.length )
  // Update existing elements
  for ( let i = 0; i < updateI; i++ ) {
    updateStreamElement( currentElements[i], selectedStreams[i] )
  }
  if ( visibleElements > selectedStreams.length ) {
    // Hide extra elements
    for ( let i = updateI; i < visibleElements; i++ ) {
      currentElements[i].style.display = 'none'
    }
  } else if ( visibleElements < selectedStreams.length ) {
    // Create new elements
    for ( let i = updateI; i < selectedStreams.length; i++ ) {
      list.appendChild( createStreamElement( selectedStreams[i] ) )
    }
    internationalize()
  }
  // Compute and apply the ideal height of the content
  visibleElements = selectedStreams.length
  const elementHeight = 42.6
  const minVisibleElements = Math.max( 5, Math.floor( ( document.body.clientHeight - ( document.getElementById( 'players-summary' ) as HTMLDivElement ).clientHeight ) / elementHeight ) )
  let playersRootHeight;
  if ( visibleElements === 0 ) {
    ( document.getElementById( 'players-no-stream' ) as HTMLDivElement ).style.removeProperty( 'display' );
    ( document.getElementById( 'players-streams' ) as HTMLDivElement ).style.display = 'none';
    playersRootHeight = 50
  } else {
    ( document.getElementById( 'players-no-stream' ) as HTMLDivElement ).style.display = 'none';
    ( document.getElementById( 'players-streams' ) as HTMLDivElement ).style.removeProperty( 'display' );
    playersRootHeight = elementHeight * Math.min( minVisibleElements, visibleElements ) + 29;
  }
  ( document.getElementById( 'players-root' ) as HTMLDivElement ).style.height = `${ playersRootHeight }px`;
  ( document.getElementById( 'players-streams' ) as HTMLDivElement ).style.maxHeight = Math.max( 212, document.body.clientHeight - ( document.getElementById( 'players-summary' ) as HTMLDivElement ).clientHeight ) + 'px'
}

function formatNumber( num: number ): string {
  if ( num >= 1_000_000 ) { return ( num / 1_000_000 ).toFixed( 1 ).replace( '.', ',' ) + ' M' } else if ( num >= 1_000 ) { return ( num / 1_000 ).toFixed( 1 ).replace( '.', ',' ) + ' K' }

  return num.toString()
}

function updateSummary( selectedStreams: EnrichedStream[], allStreams: EnrichedStream[] ) {
  const totalPlayersElement = document.getElementById( 'players-totalPlayers' ) as HTMLSpanElement
  const totalViewersElement = document.getElementById( 'players-total-viewers' ) as HTMLSpanElement
  ( document.getElementById( 'players-green' ) as HTMLSpanElement ).textContent = allStreams.filter( s => s.island === IslandType.GREEN ).length.toString();
  ( document.getElementById( 'players-orange' ) as HTMLSpanElement ).textContent = allStreams.filter( s => s.island === IslandType.ORANGE ).length.toString();

  if ( totalPlayersElement.textContent !== data.channels.length.toString() ) { totalPlayersElement.textContent = data.channels.length.toString() }


  const totalViewersFormatted = formatNumber(
    selectedStreams
      .map( s => s.viewers )
      .reduce( ( a, b ) => a + b, 0 )
  )

  if ( totalViewersElement.textContent !== totalViewersFormatted ) { totalViewersElement.textContent = totalViewersFormatted }
}

function filterChange( filters: NodeListOf<HTMLInputElement> ) {
  islands = new Set()
  filters.forEach( filter => {
    if ( filter.checked ) {
      ( islands as Set<IslandType> ).add( IslandType[filter.value as keyof typeof IslandType] )
    }
  } )
  update( streams )
}

function update( newStreams: EnrichedStream[] ) {
  streams = newStreams
  const selectedStreams = computeSelectedStreams()
  updateList( selectedStreams )
  updateSummary( selectedStreams, streams )
}

async function init() {
  if (window.innerHeight > 0) {
    document.body.style.height = `${ window.innerHeight }px`
  }
  for ( ; ; ) {
    const data = await browser.storage.local.get( 'streams' )
    if ( 'streams' in data ) {
      update( data.streams )
      break
    }
    await new Promise<void>( resolve => setTimeout( () => resolve(), 1000 ) )
  }

  const islandFilters = document.querySelectorAll( 'input.island' ) as NodeListOf<HTMLInputElement>
  islandFilters.forEach( islandFilter => {
    islandFilter.addEventListener( 'change', () => { filterChange( islandFilters ) } )
  } )

  browser.storage.onChanged.addListener( ( changes, areaName ) => {
    if ( areaName === 'local' && 'streams' in changes ) {
      update( changes.streams.newValue )
    }
  } )
}

internationalize()
await init();
( document.getElementById( 'loader' ) as HTMLDivElement ).style.display = 'none';
( document.getElementById( 'players-root' ) as HTMLDivElement ).style.removeProperty( 'display' )

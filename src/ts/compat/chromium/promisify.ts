interface options<fnArg, callbackArg> {
  fn?: ( ...args: [...[fnArg], ( ...args: [callbackArg] ) => void] ) => void
  fnNoRes?: ( ...args: [...[fnArg], () => void] ) => void
  fnNoArgs?: ( ...args: [( ...args: [callbackArg] ) => void] ) => void
  fnNoArgsNoRes?: ( callback: () => void ) => void
  args?: [fnArg]
}

function handleError( reject: ( reason?: unknown ) => void ): boolean {
  const error = chrome.runtime.lastError
  if ( error ) {
    reject( error.message )
    return true
  }
  return false
}

export default function <fnArg, callbackArg>( { fn, fnNoArgs, fnNoRes, fnNoArgsNoRes, args }: options<fnArg, callbackArg> ): Promise<callbackArg | [callbackArg]> {
  return new Promise( ( resolve, reject ) => {
    let callback: ( () => void ) | ( ( ...args: [callbackArg] ) => void )
    if ( fn || fnNoArgs ) {
      callback = ( ...args: [callbackArg] ) => {
        if ( !handleError( reject ) ) {
          resolve( args.length > 1 ? args : args[0] )
        }
      }
    } else {
      callback = () => {
        if ( !handleError( reject ) ) {
          resolve( undefined as callbackArg )
        }
      }
    }
    if ( fn && args ) {
      fn( ...args, callback )
    } else if ( fnNoRes && args ) {
      fnNoRes( ...args, callback as () => void )
    } else if ( fnNoArgs ) {
      fnNoArgs( callback )
    } else if ( fnNoArgsNoRes ) {
      fnNoArgsNoRes( callback as () => void )
    }
  } )
}

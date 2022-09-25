type Platform = {
  platform: string
}

export type StatusMessage = {
  type: 'status'
}

export type ConnectMessage = Platform & {
  type: 'connect'
  scopes?: string[]
}

export type DisconnectMessage = Platform & {
  type: 'disconnect'
}

export type Message = StatusMessage | ConnectMessage | DisconnectMessage
export type ActionMessage = ConnectMessage | DisconnectMessage

export type StatusResponse = {
  [id: string]: {
    connected: boolean
    scopes?: string[]
  }
}

export type ConnectDisconnectResponse = boolean

export type Response = StatusResponse | ConnectDisconnectResponse

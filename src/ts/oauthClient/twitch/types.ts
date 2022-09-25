export type Identifier = {
  id: string
}

export const enum BroadcasterType {
  PARTNER = 'partner',
  AFFILIATE = 'affiliate',
  NORMAL = '',
}

export const enum UserType {
  STAFF = 'staff',
  ADMIN = 'admin',
  GLOBAL_MODERATOR = 'global_mod',
  NORMAL = ''
}

type UserData = {
  broadcaster_type: BroadcasterType
  description: string
  display_name: string
  login: string
  offline_image_url: string
  profile_image_url: string
  type: UserType
  // @deprecated
  view_count: number
  email: string
  created_at: string
}

export type User = UserData & Identifier

export type StreamType = {
  user_id: string
  user_login: string
  user_name: string
  game_id: string
  game_name: string
  title: string
  viewer_count: number
  started_at: string
  language: string
  thumbnail_url: string
  tag_ids: string
  is_mature: boolean
}

export type Stream = StreamType & Identifier

export type FollowedStreamType = {
  is_mature: boolean
}

export type FollowedStream = Stream & FollowedStreamType

export type Validate = {
  client_id: string
  login: string
  scopes: string[]
  user_id: string
  expires_in: number
}

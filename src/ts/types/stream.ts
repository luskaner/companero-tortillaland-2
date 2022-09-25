export enum IslandType {
  ORANGE,
  GREEN
}

type ExtraStream = {
  island: IslandType;
};


type RemainingApiStream = {
  title: string;
  url: string;
  imageUrl: string;
  viewers: number;
  favourite: boolean;
  priority?: number;
}

export type PartialApiStream = {
  subtitle: string;
}

export type EnrichedStream = ApiStream & ExtraStream
export type ApiStream = RemainingApiStream & PartialApiStream

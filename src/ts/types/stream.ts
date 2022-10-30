export enum IslandType {
  ORANGE,
  GREEN
}

type ExtraStream = {
  island: IslandType;
};


export type ApiStream = {
  title: string;
  subtitle: string;
  url: string;
  imageUrl: string;
  viewers: number;
  favourite: boolean;
  priority?: number;
}

export type EnrichedStream = ApiStream & ExtraStream
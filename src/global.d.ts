/// <reference types="svelte" />
/// <reference types="leaflet" />

const L: typeof L;

type PortalID = string;
type OpID = string;
type TeamID = string;
type GoogleID = string;
type ZoneID = number;

type TaskID = string;
type LinkID = TaskID;
type MarkerID = TaskID;

type WDKey = {
  Name: string;
  PortalID: string;
  GID: string;
  Lat: string;
  Lng: string;
  Count: number;
  CapID: string;
};

const __buildDate__: string;

/// <reference types="svelte" />
/// <reference types="leaflet" />

const L: typeof L;

type PortalID = string;
type OpID = string;
type TeamID = string;
type GoogleID = string;
type ZoneID = number;

interface Task {
  ID: string;
  order: number;
  zone: number;
  assignedTo?: GoogleID;
  completedBy?: GoogleID;
  comment?: string;
  state: 'pending' | 'assigned' | 'acknowledged' | 'completed';
  completed: boolean;
}

type WDKey = {
  Name: string;
  PortalID: string;
  GID: string;
  Lat: string;
  Lng: string;
  Count: number;
  CapID: string;
};

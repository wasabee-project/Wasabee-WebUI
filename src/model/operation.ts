import WasabeeLink from './link';
import WasabeePortal from './portal';
import WasabeeMarker from './marker';
import WasabeeZone from './zone';
import type WasabeeMe from './me';
import type Task from './task';

// WebUI Only
const opCache: { [opId: OpID]: string } = {};

export type KeyOnHand = {
  portalId: PortalID;
  gid: GoogleID;
  capsule: string;
  onhand: number;
};

export type OpPermItem = {
  role: 'read' | 'write' | 'assignonly';
  teamid: TeamID;
  zone: number;
};

export default class WasabeeOp {
  ID: OpID;
  name: string;
  creator: GoogleID;
  anchors: PortalID[];
  links: WasabeeLink[];
  markers: WasabeeMarker[];
  color: string;
  comment: string;
  teamlist: OpPermItem[];
  fetched: string;
  keysonhand: KeyOnHand[];
  zones: WasabeeZone[];

  referencetime?: string;
  lasteditid: string;

  _idToOpportals: Map<string, WasabeePortal>;
  _coordsToOpportals: Map<string, WasabeePortal>;

  _dirtyCoordsTable: boolean = false;
  _batchmode: boolean = false;

  constructor(obj: any) {
    if (!obj || !obj.ID || !obj.creator) throw Error('Invalid op data');

    this.ID = obj.ID;
    this.creator = obj.creator;
    this.name = obj.name || '[unnamed op]';
    this.anchors = obj.anchors || [];
    this.color = obj.color || 'red';
    this.comment = obj.comment || '';
    this.teamlist = obj.teamlist || [];
    this.fetched = obj.fetched || new Date();
    this.keysonhand = obj.keysonhand || [];
    this.referencetime = obj.referencetime || null;
    this.lasteditid = obj.lasteditid;

    this.links = this.convertLinksToObjs(obj.links);
    this.markers = this.convertMarkersToObjs(obj.markers);
    this.zones = this.convertZonesToObjs(obj.zones);

    const opportals = this.convertPortalsToObjs(obj.opportals);
    this._idToOpportals = new Map();
    this._coordsToOpportals = new Map();
    if (opportals) for (const p of opportals) this._idToOpportals.set(p.id, p);
    this.buildCoordsLookupTable();
  }

  static load(opID: OpID) {
    try {
      const raw = opCache[opID];
      if (!raw)
        //throw new Error("invalid operation ID");
        return undefined;
      const op = new WasabeeOp(JSON.parse(raw));
      if (op == null) throw new Error('corrupted operation');
      return op;
    } catch (e) {
      console.error(e);
    }
  }

  static async delete(opID: OpID) {
    delete opCache[opID]; // leave for now
  }

  // CHANGED from IITC plugin
  store() {
    opCache[this.ID] = JSON.stringify(this);
  }

  toServer() {
    return {
      ID: this.ID,
      name: this.name,
      creator: this.creator,
      opportals: Array.from(this._idToOpportals.values()),
      anchors: this.anchors,
      links: this.links.map((l) => l.toServer()),
      markers: this.markers.map((m) => m.toServer()),
      color: this.color,
      comment: this.comment,
      teamlist: this.teamlist,
      fetched: this.fetched,
      keysonhand: this.keysonhand,
      zones: this.zones,
    };
  }

  // build object to serialize
  toJSON() {
    return {
      ID: this.ID,
      name: this.name,
      creator: this.creator,
      opportals: Array.from(this._idToOpportals.values()),
      anchors: this.anchors,
      links: this.links,
      markers: this.markers,
      color: this.color,
      comment: this.comment,
      teamlist: this.teamlist,
      fetched: this.fetched,
      lasteditid: this.lasteditid,
      keysonhand: this.keysonhand,
      zones: this.zones,
    };
  }

  // read only (for inspection)
  get opportals() {
    return Array.from(this._idToOpportals.values());
  }

  set opportals(_: WasabeePortal[]) { }

  buildCoordsLookupTable() {
    this._coordsToOpportals.clear();
    this._dirtyCoordsTable = false;

    for (const p of this._idToOpportals.values()) {
      const key = p.lat + '/' + p.lng;
      const old = this._coordsToOpportals.get(key);
      if (!old) this._coordsToOpportals.set(key, p);
    }

    if (this._dirtyCoordsTable) {
      console.debug('operation: removing duplicates');
      const toRemove = new Array();
      const rename = new Map();

      for (const [id, p] of this._idToOpportals) {
        const key = p.lat + '/' + p.lng;
        const preferredPortal = this._idToOpportals.get(
          // @ts-ignore
          this._coordsToOpportals.get(key).id
        );
        // @ts-ignore
        rename.set(id, preferredPortal.id);
        // @ts-ignore
        if (id != preferredPortal.id) {
          toRemove.push(id);
        }
      }
      // replace IDs
      for (const l of this.links) {
        l.fromPortalId = rename.get(l.fromPortalId);
        l.toPortalId = rename.get(l.toPortalId);
      }
      for (const m of this.markers) {
        m.portalId = rename.get(m.portalId);
      }
      this.anchors = this.anchors.map((a) => rename.get(a));

      for (const id of toRemove) this._idToOpportals.delete(id);
    }

    this._dirtyCoordsTable = false;
  }

  reverseLink(startPortalID: PortalID, endPortalID: PortalID) {
    const newLinks = [];
    for (const l of this.links) {
      if (l.fromPortalId == startPortalID && l.toPortalId == endPortalID) {
        l.fromPortalId = endPortalID;
        l.toPortalId = startPortalID;
      }
      newLinks.push(l);
    }
    this.links = newLinks;
  }

  convertLinksToObjs(links: any[]) {
    const tmpLinks = new Array();
    if (!links || links.length == 0) return tmpLinks;
    for (const l of links) {
      tmpLinks.push(new WasabeeLink(l));
    }
    return tmpLinks;
  }

  convertMarkersToObjs(markers: any[]) {
    const tmpMarkers = new Array();
    if (!markers || markers.length == 0) return tmpMarkers;
    if (markers) {
      for (const m of markers) {
        tmpMarkers.push(new WasabeeMarker(m));
      }
    }
    return tmpMarkers;
  }

  convertPortalsToObjs(portals: any[]) {
    const tmpPortals = Array();
    if (!portals || portals.length == 0) return tmpPortals;
    for (const p of portals) {
      if (p instanceof WasabeePortal) {
        tmpPortals.push(p);
      } else {
        const np = new WasabeePortal(p);
        tmpPortals.push(np);
      }
    }
    return tmpPortals;
  }

  convertZonesToObjs(zones: any[]) {
    if (!zones || zones.length == 0) {
      // if not set, use the defaults
      return [
        { id: 1, name: 'Primary', color: 'purple' },
        { id: 2, name: 'Secondary', color: 'yellow' },
      ].map((obj) => new WasabeeZone(obj));
    }
    const tmpZones = Array();
    for (const z of zones) {
      if (z instanceof WasabeeZone) {
        tmpZones.push(z);
      } else {
        const nz = new WasabeeZone(z);
        tmpZones.push(nz);
      }
    }
    return tmpZones;
  }

  getPortal(portalID: PortalID) {
    return this._idToOpportals.get(portalID);
  }

  // minimum bounds rectangle
  get mbr() {
    if (this._idToOpportals.size == 0) return null;
    const lats = [];
    const lngs = [];
    for (const a of this.anchors) {
      const portal = this.getPortal(a) as WasabeePortal;
      lats.push(+portal.lat);
      lngs.push(+portal.lng);
    }
    for (const m of this.markers) {
      const portal = this.getPortal(m.portalId) as WasabeePortal;
      lats.push(+portal.lat);
      lngs.push(+portal.lng);
    }
    if (!lats.length) return null;
    const minlat = Math.min.apply(null, lats);
    const maxlat = Math.max.apply(null, lats);
    const minlng = Math.min.apply(null, lngs);
    const maxlng = Math.max.apply(null, lngs);
    const min = L.latLng(minlat, minlng);
    const max = L.latLng(maxlat, maxlng);
    return L.latLngBounds(min, max);
  }

  // this is only for local display if FireBase doesn't trigger a refresh
  // KOH always takes place on the server because non-write-access
  // agents need to make changes & sync
  keyOnHand(
    portalId: PortalID,
    gid: GoogleID,
    onhand: number,
    capsule: string
  ) {
    if (typeof onhand == 'string') {
      onhand = Number.parseInt(onhand, 10);
    }

    for (const k of this.keysonhand) {
      // fix broken ops
      if (typeof k.onhand == 'string') {
        k.onhand = Number.parseInt(k.onhand, 10);
      }

      if (k.portalId == portalId && k.gid == gid) {
        k.onhand = onhand;
        k.capsule = capsule;
        return;
      }
    }

    const k = {
      portalId: portalId,
      gid: gid,
      onhand: onhand,
      capsule: capsule,
    };
    this.keysonhand.push(k);
  }

  keysOnHandForPortal(portalId: PortalID) {
    let i = 0;
    for (const k of this.keysonhand) if (k.portalId == portalId) i += k.onhand;
    return i;
  }

  keysOnHandForPortalPerAgent(portalId: PortalID) {
    const is: { [agentID: GoogleID]: number } = {};
    for (const k of this.keysonhand) {
      if (k.portalId == portalId) {
        if (!(k.gid in is)) is[k.gid] = 0;
        is[k.gid] += k.onhand;
      }
    }
    return is;
  }

  keysRequiredForPortal(portalId: PortalID) {
    let i = 0;
    for (const l of this.links) if (l.toPortalId == portalId) i++;
    return i;
  }

  keysRequiredForPortalPerAgent(portalId: PortalID) {
    const is: { [agentID: GoogleID | '[unassigned]']: number } = {};
    for (const l of this.links) {
      const id = l.assignedTo || '[unassigned]';
      if (l.toPortalId == portalId) {
        if (!(id in is)) is[id] = 0;
        is[id]++;
      }
    }
    return is;
  }

  keysRequiredPerPortalPerZone() {
    const is: { to: PortalID; zone: ZoneID; count: number }[] = [];
    for (const l of this.links) {
      const s = is.find((v) => v.to == l.toPortalId && v.zone == l.zone);
      if (s) s.count += 1;
      else is.push({ to: l.toPortalId, zone: l.zone, count: 1 });
    }
    return is;
  }

  zoneName(zoneID: number | string) {
    zoneID = +zoneID;
    if (zoneID == 0)
      // All zone
      return 'All';
    for (const z of this.zones) {
      if (z.id == zoneID) return z.name;
    }
    return zoneID;
  }

  // a wrapper to set WasabeePortal or WasabeeLink zone and update
  setZone(thing: Task, zoneID: number | string) {
    thing.zone = Number(zoneID);
  }

  removeZone(zoneID: number) {
    if (zoneID == 1) {
      console.log('cannot remove zone 1');
      return;
    }
    for (const m of this.markers) {
      if (m.zone == zoneID) m.zone = 1;
    }
    for (const l of this.links) {
      if (l.zone == zoneID) l.zone = 1;
    }
    this.zones = this.zones.filter((z) => {
      return z.id != zoneID;
    });
  }

  removeZonePoints(zoneID: number) {
    for (const z of this.zones) {
      if (z.id == zoneID) {
        z.points = [];
      }
    }
  }

  renameZone(zoneID: number, name: string) {
    for (const z of this.zones) {
      if (z.id == zoneID) {
        z.name = name;
        break;
      }
    }
  }

  addZone() {
    const ids = new Set<number>();
    for (const z of this.zones) {
      ids.add(z.id);
    }
    const newid = Math.max(...ids) + 1;
    this.zones.push(new WasabeeZone({ id: newid, name: newid }));
    return newid;
  }

  mayWrite(me: WasabeeMe) {
    if (me.id === this.creator) return true;
    const writers = this.teamlist
      .filter((t) => t.role === 'write')
      .map((t) => t.teamid);
    return me.Teams.some((t) => writers.includes(t.ID));
  }
}

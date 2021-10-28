const agentCache = new Map<GoogleID, WasabeeAgent>();

export default class WasabeeAgent {
  id: GoogleID;
  name: string;
  vname?: string;
  rocksname?: string;
  intelname?: string;
  intelfaction: 'unset' | 'ENLIGHTENED' | 'RESISTANCE';
  level: number;
  enlid?: string;
  pic?: string;
  Vverified: boolean;
  blacklisted: boolean;
  rocks: boolean;
  lat: number;
  lng: number;
  date: string;

  ShareWD?: boolean;
  LoadWD?: boolean;
  squad?: string;
  state?: boolean;

  fetched: number;
  cached?: boolean;

  constructor(obj: any) {
    // things which are stable across all teams
    this.id = obj.id;
    this.name = obj.name;
    this.vname = obj.vname;
    this.rocksname = obj.rocksname;
    this.intelname = obj.intelname;
    this.intelfaction = obj.intelfaction;
    this.level = obj.level ? Number(obj.level) : 0;
    this.enlid = obj.enlid ? obj.enlid : null;
    this.pic = obj.pic ? obj.pic : null;
    this.Vverified = !!obj.Vverified;
    this.blacklisted = !!obj.blacklisted;
    this.rocks = !!obj.rocks;
    this.lat = obj.lat ? obj.lat : 0;
    this.lng = obj.lng ? obj.lng : 0;
    this.date = obj.date ? obj.date : null; // last location sub, not fetched

    /* what did we decide to do with these?
    this.startlat = obj.startlat ? obj.startlat : 0;
    this.startlng = obj.startlng ? obj.startlng : 0;
    this.startradius = obj.startradius ? Number(obj.startradius) : 0;
    this.sharestart = obj.sharestart ? obj.sharestart : false; */

    // vary per-team, don't set on direct pulls
    if (obj.ShareWD) this.ShareWD = obj.ShareWD;
    if (obj.LoadWD) this.LoadWD = obj.LoadWD;
    if (obj.squad) this.squad = obj.squad;
    if (obj.state) this.state = obj.state;
    // this.distance = obj.distance ? Number(obj.distance) : 0; // don't use this

    // not sent by server, but preserve if from cache
    this.fetched = obj.fetched ? obj.fetched : Date.now();

    // push the new data into the agent cache
    agentCache.set(this.id, this);
  }

  get latLng() {
    if (this.lat || this.lng) return new L.LatLng(this.lat, this.lng);
    return null;
  }

  static get(gid: GoogleID) {
    if (agentCache.has(gid)) {
      return agentCache.get(gid);
    }
    return null;
  }
}

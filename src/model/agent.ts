const agentCache = new Map<GoogleID, WasabeeAgent>();

interface BaseAgent {
  id: GoogleID;
  name: string;
  intelname?: string;
  intelfaction: 'unset' | 'ENLIGHTENED' | 'RESISTANCE';
  communityname?: string;
  pic?: string;
  lat: number;
  lng: number;
  date: string;
}

interface RockAgent extends BaseAgent {
  rocksname?: string;
  rocks: boolean;
}

interface VAgent extends BaseAgent {
  enlid?: string;
  vname?: string;
  Vverified: boolean;
  level: number;
  blacklisted: boolean;
}

interface ServerTeamAgent extends BaseAgent {
  ShareWD?: boolean;
  LoadWD?: boolean;
  state?: boolean;
  squad?: string;
}

export interface ServerAgent
  extends BaseAgent,
    RockAgent,
    VAgent,
    ServerTeamAgent {}

// local model
interface TeamAgent extends BaseAgent {
  shareWDKeys?: boolean;
  loadWDKeys?: boolean;
  shareLocation?: boolean;
  comment?: string;
}

interface Agent extends BaseAgent, RockAgent, VAgent, TeamAgent {
  fetched?: number;
}

// convert agent in server model to client model
function serverAgentToAgent(agent: ServerAgent) {
  return {
    ...agent,
    shareWDKeys: agent.ShareWD,
    loadWDKeys: agent.LoadWD,
    shareLocation: agent.state,
    comment: agent.squad,
  };
}

export default class WasabeeAgent implements Agent {
  id: GoogleID;
  name: string;
  intelname?: string;
  intelfaction: 'unset' | 'ENLIGHTENED' | 'RESISTANCE';
  communityname?: string;
  pic?: string;
  lat: number;
  lng: number;
  date: string;

  // V
  enlid?: string;
  vname?: string;
  Vverified: boolean;
  level: number;
  blacklisted: boolean;

  // rocks
  rocksname?: string;
  rocks: boolean;

  // per team data
  shareWDKeys?: boolean;
  loadWDKeys?: boolean;
  shareLocation?: boolean;
  comment?: string;

  fetched: number;

  constructor(obj: Agent) {
    if ('ShareWD' in obj) {
      obj = serverAgentToAgent(obj);
    }
    // things which are stable across all teams
    this.id = obj.id;
    this.name = obj.name;
    this.intelname = obj.intelname !== 'unset' ? obj.intelname : '';
    this.intelfaction = obj.intelfaction;
    this.communityname = obj.communityname || '';
    this.pic = obj.pic ? obj.pic : null;
    this.lat = obj.lat ? obj.lat : 0;
    this.lng = obj.lng ? obj.lng : 0;
    this.date = obj.date ? obj.date : null; // last location sub, not fetched
    // V
    this.enlid = obj.enlid ? obj.enlid : null;
    this.vname = obj.vname;
    this.Vverified = !!obj.Vverified;
    this.level = obj.level ? Number(obj.level) : 0;
    this.blacklisted = !!obj.blacklisted;
    // rocks
    this.rocksname = obj.rocksname;
    this.rocks = !!obj.rocks;

    if (this.Vverified) this.name = this.vname || this.name;
    else if (this.rocks) this.name = this.rocksname || this.name;
    else if (this.communityname) this.name = this.communityname + ' [C]';
    else if (this.intelname) this.name = this.intelname + ' [!]';

    /* what did we decide to do with these?
    this.startlat = obj.startlat ? obj.startlat : 0;
    this.startlng = obj.startlng ? obj.startlng : 0;
    this.startradius = obj.startradius ? Number(obj.startradius) : 0;
    this.sharestart = obj.sharestart ? obj.sharestart : false; */

    // vary per-team, don't set on direct pulls
    if (obj.shareWDKeys) this.shareWDKeys = obj.shareWDKeys;
    if (obj.loadWDKeys) this.loadWDKeys = obj.loadWDKeys;
    if (obj.shareLocation) this.shareLocation = obj.shareLocation;
    if (obj.comment) this.comment = obj.comment;
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

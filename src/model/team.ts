import WasabeeAgent from './agent';

const teamCache = new Map<TeamID, WasabeeTeam>();

export default class WasabeeTeam {
  id: TeamID;
  fetched: number;
  name: string;
  rc: string;
  rk: string;
  jlt: string;
  vt: string;
  vr: string;
  agents: WasabeeAgent[];

  _a: WasabeeAgent[];
  cached: boolean;

  constructor(data: any) {
    let fromServer = false;
    if (data.fetched == null) fromServer = true;
    this.fetched = data.fetched ? data.fetched : Date.now();

    this.id = data.id;
    this.name = data.name;
    this.rc = data.rc;
    this.rk = data.rk;
    this.jlt = data.jlt;
    this.vt = data.vt;
    this.vr = data.vr;
    this.agents = data.agents; // raw agent data

    // this block (1) adds agent to agents cache and (2) populates _a
    // _a is a buffer of pre-built WasabeeAgents we can return via getAgents() w/o having to await
    this._a = new Array();
    for (const agent of data.agents) {
      agent.fetched = this.fetched;
      this._a.push(new WasabeeAgent(agent)); // add to agent cache
    }

    if (fromServer) this._updateCache();
  }

  getAgents() {
    return this._a;
  }

  async _updateCache() {
    teamCache.set(this.id, this);
  }

  static get(teamID: TeamID) {
    const cached = teamCache.get(teamID);
    if (cached) {
      const t = new WasabeeTeam(cached);
      return t;
    }
    return null;
  }
}

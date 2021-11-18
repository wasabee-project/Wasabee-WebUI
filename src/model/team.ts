import WasabeeAgent, { ServerAgent } from './agent';

const teamCache = new Map<TeamID, WasabeeTeam>();

interface RocksTeam {
  rc: string;
  rk: string;
}

interface VTeam {
  vt: string;
  vr: string;
}

interface ServerTeam extends RocksTeam, VTeam {
  id: TeamID;
  name: string;
  agents: ServerAgent[];
  jlt: string;
}

interface Team extends RocksTeam, VTeam {
  id: TeamID;
  name: string;
  agents: WasabeeAgent[];
  jlt: string;

  fetched?: number;
}

export default class WasabeeTeam implements Team {
  id: TeamID;
  name: string;
  agents: WasabeeAgent[];
  jlt: string;
  // Rocks
  rc: string;
  rk: string;
  // V
  vt: string;
  vr: string;

  fetched: number;

  constructor(data: Team) {
    this.fetched = data.fetched ? data.fetched : Date.now();

    this.id = data.id;
    this.name = data.name;
    this.rc = data.rc;
    this.rk = data.rk;
    this.jlt = data.jlt;
    this.vt = data.vt;
    this.vr = data.vr;
    this.agents = data.agents.map((a) => new WasabeeAgent(a));

    teamCache.set(this.id, this);
  }

  static get(teamID: TeamID) {
    const cached = teamCache.get(teamID);
    if (cached) {
      return cached;
    }
    return null;
  }
}

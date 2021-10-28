// very different from IITC version
import WasabeeAgent from './agent';

const AGENT_INFO_KEY = 'me';

export interface MeTeam {
  ID: TeamID;
  Name: string;
  RocksComm: string;
  RocksKey: string;
  JoinLinkToken: string;
  ShareWD: boolean;
  LoadWD: boolean;
  State: boolean;
  Owner: string;
  VTeam: string;
  VTeamRole: string;
}

interface MeOp {
  ID: OpID;
  Name: string;
  IsOwner: boolean;
  Color: string; // ??
  TeamID: TeamID;
}

export class WasabeeMe extends WasabeeAgent {
  querytoken?: string;
  lockey?: string;
  vapi?: string;

  Telegram: {
    ID: string;
    Verified: boolean;
    Authtoken: string;
  };

  Teams: MeTeam[];
  Ops: MeOp[];

  constructor(obj: any) {
    obj.id = obj.GoogleID || obj.id;
    super(obj);
    this.querytoken = obj.querytoken;
    this.pic = obj.pic;
    this.intelfaction = obj.intelfaction;
    this.lockey = obj.lockey;
    this.querytoken = obj.lockey;
    this.vapi = obj.vapi;

    if (obj.Telegram) {
      this.Telegram = {
        ID: obj.Telegram.ID,
        Verified: obj.Telegram.Verified,
        Authtoken: obj.Telegram.Authtoken,
      };
    }

    this.Teams = Array();
    if (obj.Teams !== null) {
      for (const team of obj.Teams) {
        team.ShareWD = team.ShareWD == 'On' || team.ShareWD === true;
        team.LoadWD = team.LoadWD == 'On' || team.LoadWD === true;
        team.State = team.State == 'On' || team.State === true;
        this.Teams.push(team);
      }
    }

    this.Ops = Array();
    if (obj.Ops && obj.Ops.length > 0) {
      for (const op of obj.Ops) {
        this.Ops.push(op);
      }
    }
  }

  // default
  toJSON() {
    return this;
  }

  store() {
    localStorage[AGENT_INFO_KEY] = JSON.stringify(this);
  }

  static remove() {
    delete localStorage[AGENT_INFO_KEY];
  }

  static get() {
    const raw = localStorage[AGENT_INFO_KEY];
    if (raw == null) return null;
    return new WasabeeMe(JSON.parse(raw));
  }

  static purge() {
    const me = WasabeeMe.get();
    if (me) {
      for (const op of me.Ops) {
        delete localStorage[op.ID];
      }
      WasabeeMe.remove();
    }
  }

  getTeam(id: TeamID): MeTeam {
    for (const t of this.Teams) {
      if (t.ID == id) return t;
    }
    return null;
  }
}

export default WasabeeMe;

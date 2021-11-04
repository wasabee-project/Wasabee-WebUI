import WasabeeAgent, { serverAgentToAgent } from './model/agent';
import WasabeeMe, { serverMeToMe } from './model/me';
import WasabeeTeam, { serverTeamToTeam } from './model/team';
import { agentPromise, mePromise, teamPromise } from './server';

export async function getMe(force = false) {
  if (!force) {
    const lsme = WasabeeMe.get();
    if (lsme) {
      const maxCacheAge = Date.now() - 1000 * 60 * 60;
      if (lsme.fetched && lsme.fetched > maxCacheAge) {
        return lsme;
      }
    }
  }

  try {
    const raw = await mePromise();
    const me = serverMeToMe(raw);
    return me;
  } catch (e) {
    console.log(e);
  }
  return null;
}

export async function getAgent(gid: GoogleID) {
  const agent = WasabeeAgent.get(gid);
  if (agent) return agent;

  try {
    const result = await agentPromise(gid);
    const newagent = serverAgentToAgent(result);
    return newagent;
  } catch (e) {
    console.log(e);
  }
  return null;
}

// 60 seconds seems too short for the default here...
export async function getTeam(teamID: TeamID, maxAgeSeconds = 60) {
  const cached = WasabeeTeam.get(teamID);
  if (cached) {
    const t = new WasabeeTeam(cached);
    if (t.fetched > Date.now() - 1000 * maxAgeSeconds) {
      return t;
    }
  }

  try {
    const t = await teamPromise(teamID);
    return serverTeamToTeam(t);
  } catch (e) {
    console.error(e);
  }
  return null;
}

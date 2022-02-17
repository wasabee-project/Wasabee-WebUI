import WasabeeAgent from './model/agent';
import WasabeeMe from './model/me';
import WasabeeTeam from './model/team';
import { agentPromise, mePromise, teamPromise } from './server';

import { agentsStore, teamsStore } from './stores';

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
    const me = new WasabeeMe(raw);
    return me;
  } catch (e) {
    console.log(e);
  }
  return null;
}

export async function getAgent(gid: GoogleID) {
  if (!gid) return null;
  const agent = WasabeeAgent.get(gid);
  if (agent) return agent;

  try {
    const result = await agentPromise(gid);
    const newagent = new WasabeeAgent(result);
    agentsStore.updateAgent(newagent);
    return newagent;
  } catch (e) {
    console.log(e);
  }
  return null;
}

// 60 seconds seems too short for the default here...
export async function getTeam(teamID: TeamID, maxAgeSeconds = 60) {
  if (!teamID) return null;
  const cached = WasabeeTeam.get(teamID);
  if (cached) {
    const t = new WasabeeTeam(cached);
    if (t.fetched > Date.now() - 1000 * maxAgeSeconds) {
      return t;
    }
  }

  try {
    const t = await teamPromise(teamID);
    const team = new WasabeeTeam(t);
    teamsStore.updateTeam(team);
    for (const a of team.agents) agentsStore.updateAgent(a);
    return team;
  } catch (e) {
    console.error(e);
  }
  return null;
}

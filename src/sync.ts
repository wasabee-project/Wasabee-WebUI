import type { WasabeeMe } from './model';
import { opPromise } from './server';

import { getMe, getTeam } from './cache';

export async function syncMe() {
  const nme = await getMe(true);
  nme.store();
  return nme;
}

export async function loadMeAndOps() {
  try {
    const nme = await syncMe();
    if (nme) {
      // load all available ops and teams
      await syncOps(nme);
      await syncTeams(nme);
    } else {
      console.log(nme);
      throw new Error('invalid data from /me');
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}

function opsList() {
  const l: string[] = [];
  const lsk = Object.keys(localStorage);
  for (const id of lsk) {
    if (id.length == 40) l.push(id);
  }
  return l;
}

export function clearOpsStorage() {
  for (const id of opsList()) {
    delete localStorage[id];
  }
}

export async function syncOps(me: WasabeeMe) {
  const opsID = new Set(me.Ops.map((o) => o.ID));

  // clear unknown id
  for (const id of opsList()) if (!opsID.has(id)) delete localStorage[id];

  const promises = new Array();
  for (const o of opsID) promises.push(opPromise(o));
  try {
    const results = await Promise.allSettled(promises);
    for (const r of results) {
      if (r.status != 'fulfilled') {
        console.log(r);
        throw new Error('Op load failed, please refresh');
      }
      r.value.store();
    }
  } catch (e) {
    console.log(e);
    // return;
  }
}

export async function syncTeams(me: WasabeeMe) {
  const meTeams = new Set(me.Teams.map((t) => t.ID));
  const teamPromises = new Array();
  for (const t of meTeams) teamPromises.push(getTeam(t, 300));
  try {
    const results = await Promise.allSettled(teamPromises);
    for (const r of results) {
      if (r.status != 'fulfilled') {
        console.log(r);
        // throw new Error("team load failed, please refresh");
      }
    }
  } catch (e) {
    console.log(e);
    return;
  }
}

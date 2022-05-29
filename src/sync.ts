import { meStore, opsStore, teamsStore } from './stores';

export function syncMe() {
  return meStore.refresh();
}

export async function loadMeAndOps() {
  try {
    const nme = await syncMe();
    if (nme) {
      // load all available ops and teams
      opsStore.updateFromMe(nme);
      await teamsStore.updateFromMe(nme);
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

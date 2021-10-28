import WasabeeMe from './model/me';
import WasabeeOp from './model/operation';
import WasabeeMarker from './model/marker';

import type WasabeePortal from './model/portal';

export default function () {
  return GetWasabeeServer();
}

// removes an op from the server
export function deleteOpPromise(opID: OpID) {
  return genericDelete(`/api/v1/draw/${opID}`, new FormData());
}

// returns a promise to op stat from the server
export function statOpPromise(opID: OpID) {
  return genericGet(`/api/v1/draw/${opID}/stat`);
}

// returns a promise to a WasabeeTeam -- used only by WasabeeTeam.get
// use WasabeeTeam.get
export function teamPromise(teamid: TeamID) {
  return genericGet(`/api/v1/team/${teamid}`);
}

// returns a promise to fetch a WasabeeOp
// local change: If the server's copy is newer than the local copy, otherwise none
// not generic since 304 result processing and If-Modified-Since header
export async function opPromise(opID: OpID) {
  const localop = WasabeeOp.load(opID);

  try {
    const server = GetWasabeeServer();
    const headers = {};
    // ops synced since 0.19: prefer lasteditid if available
    if (localop && localop.lasteditid)
      headers['If-None-Match'] = localop.lasteditid;
    const response = await fetch(server + `/api/v1/draw/${opID}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      redirect: 'manual',
      referrerPolicy: 'origin',
      headers: headers,
    });

    let raw = null;
    let newop: WasabeeOp = null; // I hate javascript
    switch (response.status) {
      case 200:
        raw = await response.json();
        newop = new WasabeeOp(raw);
        return Promise.resolve(newop);
      case 304: // If-None-Match or If-Modified-Since replied NotModified
        console.warn('server copy is older/unmodified, keeping local copy');
        return Promise.resolve(localop);
      case 401:
        WasabeeMe.purge();
        raw = await response.json();
        return Promise.reject('not logged in: ' + raw.error);
      case 403:
        await WasabeeOp.delete(opID);
        raw = await response.json();
        return Promise.reject('permission denied: ' + raw.error);
      case 410:
        await WasabeeOp.delete(opID);
        raw = await response.json();
        return Promise.reject('permission deleted: ' + raw.error);
      default:
        try {
          const err = await response.json();
          return Promise.reject(err.error);
        } catch (e) {
          console.error(e);
          raw = await response.text();
          return Promise.reject(raw);
        }
    }
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}

// returns a promise to WasabeeMe -- should be called only by WasabeeMe.waitGet()
// use WasabeeMe.cacheGet or WasabeeMe.waitGet for caching
export function mePromise() {
  return genericGet('/api/v1/me');
}

// returns a promise to get the agent's JSON data from the server -- should be called only by WasabeeAgent.get()
export function agentPromise(GID: GoogleID) {
  return genericGet(`/api/v1/agent/${GID}`);
}

// local change: none // cache: none
export function assignMarkerPromise(
  opID: OpID,
  markerID: string,
  agentID: GoogleID
) {
  const fd = new FormData();
  fd.append('agent', agentID);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/assign`, fd);
}

// performs a link assignment on the server, sending notifications
export function assignLinkPromise(
  opID: OpID,
  linkID: string,
  agentID: GoogleID
) {
  const fd = new FormData();
  fd.append('agent', agentID);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/assign`, fd);
}

// sends a target (portal) to the server to notify the agent
export function targetPromise(
  agentID: GoogleID,
  portal: WasabeePortal,
  type = 'ad hoc'
) {
  return genericPost(
    `/api/v1/agent/${agentID}/target`,
    JSON.stringify({
      Name: portal.name,
      Lat: portal.lat,
      Lng: portal.lng,
      ID: portal.id,
      Type: type,
    }),
    'application/json;charset=UTF-8'
  );
}

// work in progress -- server support not finished
export function routePromise(agentID: GoogleID, portal: WasabeePortal) {
  const ll = portal.lat + ',' + portal.lng;
  const fd = new FormData();
  fd.append('id', agentID);
  fd.append('portal', portal.name);
  fd.append('ll', ll);
  return genericPost(`/api/v1/agent/${agentID}/route`, fd);
}

// returns a promise to /me if the access token is valid
export function SendAccessTokenAsync(accessToken: string) {
  return genericPost(
    '/aptok',
    JSON.stringify({ accessToken: accessToken }),
    'application/json;charset=UTF-8'
  );
}

// changes agent's team state on the server; return value is status message
export function SetTeamState(teamID: TeamID, state: 'On' | 'Off') {
  return genericGet(`/api/v1/me/${teamID}?state=${state}`);
}

export function SetTeamShareWD(teamID: TeamID, state: 'On' | 'Off') {
  return genericGet(`/api/v1/me/${teamID}/wdshare?state=${state}`);
}

export function SetTeamLoadWD(teamID: TeamID, state: 'On' | 'Off') {
  return genericGet(`/api/v1/me/${teamID}/wdload?state=${state}`);
}

// changes a markers status on the server, sending relevant notifications
export function SetMarkerState(
  opID: OpID,
  markerID: string,
  state: 'pending' | 'acknowledged' | 'completed'
) {
  let action = 'incomplete';
  switch (state) {
    case 'acknowledged':
      action = 'acknowledge';
      break;
    case 'pending':
      action = 'incomplete';
      break;
    case 'completed':
      action = 'complete';
      break;
    default:
      action = 'incomplete';
  }

  return genericGet(`/api/v1/draw/${opID}/marker/${markerID}/${action}`);
}

// changes a link's status on the server, sending relevant notifications
export function SetLinkState(
  opID: OpID,
  linkID: string,
  state: 'pending' | 'acknowledged' | 'completed'
) {
  let action = 'incomplete';
  switch (state) {
    // no acknowledge for links -- use incomplete
    case 'pending':
      action = 'incomplete';
      break;
    case 'completed':
      action = 'complete';
      break;
    default:
      action = 'incomplete';
  }

  return genericGet(`/api/v1/draw/${opID}/link/${linkID}/${action}`);
}

// updates an agent's key count, return value is status code
export function opKeyPromise(
  opID: OpID,
  portalID: PortalID,
  onhand: number,
  capsule: string
) {
  const fd = new FormData();
  fd.append('count', `${onhand}`);
  fd.append('capsule', capsule);
  return genericPost(`/api/v1/draw/${opID}/portal/${portalID}/keyonhand`, fd);
}

// updates an agent's single defensive key
export function dKeyPromise(json: string) {
  return genericPost('/api/v1/d', json, 'application/json;charset=UTF-8');
}

// many d-keys at once
export function dKeyBulkPromise(json: string) {
  return genericPost('/api/v1/d/bulk', json, 'application/json;charset=UTF-8');
}

// returns a promise to a list of defensive keys for all enabled teams
export function dKeylistPromise() {
  return genericGet('/api/v1/d');
}

// updates an agent's location ; return value is status code
export function locationPromise(lat: number, lng: number) {
  return genericGet(`/api/v1/me?lat=${lat}&lon=${lng}`);
}

// sets logout status on the server; return value is status code
export function logoutPromise() {
  return genericGet('/api/v1/me/logout');
}

// adds a permission to an op; return value is status code
export function addPermPromise(
  opID: OpID,
  teamID: TeamID,
  role: 'read' | 'write' | 'assignonly',
  zone: number
) {
  const fd = new FormData();
  fd.append('team', teamID);
  fd.append('role', role);
  fd.append('zone', `${zone}`);
  return genericPost(`/api/v1/draw/${opID}/perms`, fd);
}

// removes a permission from an op; return value is status code
export function delPermPromise(
  opID: OpID,
  teamID: TeamID,
  role: 'read' | 'write' | 'assignonly',
  zone: number
) {
  const fd = new FormData();
  fd.append('team', teamID);
  fd.append('role', role);
  fd.append('zone', `${zone}`);
  return genericDelete(`/api/v1/draw/${opID}/perms`, fd);
}

// removes the agent from the team; return value is status code
export function leaveTeamPromise(teamID: TeamID) {
  return genericDelete(`/api/v1/me/${teamID}`, new FormData());
}

// removes another agent from an owned team ; return value is status code
export function removeAgentFromTeamPromise(agentID: GoogleID, teamID: TeamID) {
  return genericDelete(`/api/v1/team/${teamID}/${agentID}`, new FormData());
}

// local change: none // cache: none
export function setAgentTeamSquadPromise(
  agentID: GoogleID,
  teamID: TeamID,
  squad: string
) {
  const fd = new FormData();
  fd.append('squad', squad);
  return genericPost(`/api/v1/team/${teamID}/${agentID}/squad`, fd);
}

// local change: none // cache: none
export function addAgentToTeamPromise(agentID: GoogleID, teamID: TeamID) {
  return genericPost(`/api/v1/team/${teamID}/${agentID}`, new FormData());
}

// local change: none // cache: none
export function renameTeamPromise(teamID: TeamID, name: string) {
  const fd = new FormData();
  fd.append('teamname', name);
  return genericPut(`/api/v1/team/${teamID}/rename`, fd);
}

// local change: none // cache: none
export function rocksPromise(
  teamID: TeamID,
  community: string,
  apikey: string
) {
  return genericGet(
    `/api/v1/team/${teamID}/rockscfg?rockscomm=${community}&rockskey=${apikey}`
  );
}

// local change: none // cache: none
export function newTeamPromise(name: string) {
  return genericGet(`/api/v1/team/new?name=${name}`);
}

// local change: none // cache: none
export function deleteTeamPromise(teamID: TeamID) {
  return genericDelete(`/api/v1/team/${teamID}`, new FormData());
}

// local change: none // cache: none
export function oneTimeToken(token: string) {
  const url = '/oneTimeToken';
  const fd = new FormData();
  fd.append('token', token);
  return genericPost(url, fd);
}

async function genericPut(
  url: string,
  formData: FormData | string,
  contentType?: string
) {
  try {
    const construct: RequestInit = {
      method: 'PUT',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      redirect: 'manual',
      referrerPolicy: 'origin',
      body: formData,
    };
    if (contentType != null) {
      construct.headers = { 'Content-Type': contentType };
    }
    const response = await fetch(GetWasabeeServer() + url, construct);

    switch (response.status) {
      case 200:
        try {
          const obj = await response.json();
          if (obj.updateID) GetUpdateList().set(obj.updateID, Date.now());
          return Promise.resolve(obj);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      case 401:
        WasabeeMe.purge();
        try {
          const err = await response.json();
          return Promise.reject('not logged in: ' + err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      default:
        try {
          const err = await response.json();
          return Promise.reject(err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
    }
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}

async function genericPost(
  url: string,
  formData: FormData | string,
  contentType?: string
) {
  try {
    const construct: RequestInit = {
      method: 'POST',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      redirect: 'manual',
      referrerPolicy: 'origin',
      body: formData,
    };
    if (contentType != null) {
      construct.headers = { 'Content-Type': contentType };
    }
    const response = await fetch(GetWasabeeServer() + url, construct);

    switch (response.status) {
      case 200:
        try {
          const obj = await response.json();
          if (obj.updateID) GetUpdateList().set(obj.updateID, Date.now());
          return Promise.resolve(obj);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      case 401:
        WasabeeMe.purge();
        try {
          const err = await response.json();
          return Promise.reject('not logged in: ' + err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      default:
        try {
          const err = await response.json();
          return Promise.reject(err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
    }
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}

async function genericDelete(
  url: string,
  formData: FormData | string,
  contentType?: string
) {
  try {
    const construct: RequestInit = {
      method: 'DELETE',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      redirect: 'manual',
      referrerPolicy: 'origin',
      body: formData,
    };
    if (contentType != null) {
      construct.headers = { 'Content-Type': contentType };
    }
    const response = await fetch(GetWasabeeServer() + url, construct);

    switch (response.status) {
      case 200:
        try {
          const obj = await response.json();
          if (obj.updateID) GetUpdateList().set(obj.updateID, Date.now());
          return Promise.resolve(obj);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      case 401:
        WasabeeMe.purge();
        try {
          const err = await response.json();
          return Promise.reject('not logged in: ' + err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      default:
        try {
          const err = await response.json();
          return Promise.reject(err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
    }
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}

async function genericGet(url: string) {
  try {
    const response = await fetch(GetWasabeeServer() + url, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
      credentials: 'include',
      redirect: 'manual',
      referrerPolicy: 'origin',
    });

    switch (response.status) {
      case 200:
        try {
          const obj = await response.json();
          if (obj.updateID) GetUpdateList().set(obj.updateID, Date.now());
          return Promise.resolve(obj);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      case 401:
        WasabeeMe.purge();
        try {
          const err = await response.json();
          return Promise.reject('not logged in: ' + err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      case 403:
        try {
          const err = await response.json();
          return Promise.reject('forbidden: ' + err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
      default:
        console.log(response);
        try {
          const err = await response.json();
          return Promise.reject(err.error);
        } catch (e) {
          console.error(e);
          return Promise.reject(e);
        }
      // break;
    }
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
}

export function GetWasabeeServer() {
  return 'https://am.wasabee.rocks';
}

export function GetUpdateList() {
  // @ts-ignore
  return window.wasabeewebui._updateList;
}

/* The following are for Wasabee-WebUI and not used in Wasabee-IITC */

// in the service-worker for IITC
export function sendTokenToWasabee(token: string) {
  // no need for a form-data, just send the raw token
  return genericPost(`/api/v1/me/firebase`, token);
}

export function getCustomTokenFromServer() {
  return genericGet(`/api/v1/me/firebase`);
}

export function loadConfig() {
  return genericGet(`/static/wasabee-webui-config.json`);
}

export function changeTeamOwnerPromise(teamID: TeamID, newOwner: GoogleID) {
  return genericGet(`/api/v1/team/${teamID}/chown?to=${newOwner}`);
}

export function createJoinLinkPromise(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/genJoinKey`);
}

export function deleteJoinLinkPromise(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/delJoinKey`);
}

export function setAssignmentStatus(
  op: WasabeeOp,
  object: Task,
  completed: boolean
) {
  let type = 'link';
  if (object instanceof WasabeeMarker) type = 'marker';
  let c = 'incomplete';
  if (completed) c = 'complete';

  return genericGet(`/api/v1/draw/${op.ID}/${type}/${object.ID}/${c}`);
}

export function sendAnnounce(teamID: TeamID, message: string) {
  const fd = new FormData();
  fd.append('m', message);
  return genericPost(`/api/v1/team/${teamID}/announce`, fd);
}

export function pullRocks(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/rocks`);
}

export function reverseLinkDirection(opID: OpID, linkID: string) {
  return genericGet(`/api/v1/draw/${opID}/link/${linkID}/swap`);
}

export function setOpInfo(opID: OpID, info: string) {
  const fd = new FormData();
  fd.append('info', info);
  return genericPost(`/api/v1/draw/${opID}/info`, fd);
}

export function setMarkerComment(
  opID: OpID,
  markerID: string,
  comment: string
) {
  const fd = new FormData();
  fd.append('comment', comment);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/comment`, fd);
}

export function setLinkComment(opID: OpID, linkID: string, desc: string) {
  const fd = new FormData();
  fd.append('desc', desc);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/desc`, fd);
}

export function setLinkZone(opID: OpID, linkID: string, zone: number) {
  const fd = new FormData();
  fd.append('zone', `${zone}`);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/zone`, fd);
}

export function setMarkerZone(opID: OpID, markerID: string, zone: number) {
  const fd = new FormData();
  fd.append('zone', `${zone}`);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/zone`, fd);
}

export function setVAPIkey(v: string) {
  const fd = new FormData();
  fd.append('v', v);
  return genericPost('/api/v1/me/VAPIkey', fd);
}

export function pullV(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/v`);
}

export function configV(
  teamID: TeamID,
  vteam: string | number,
  role: string | number
) {
  vteam = Number(vteam);
  role = Number(role);
  if (role < 0 || role > 200) {
    role = 0;
  }
  console.log(teamID, vteam, role);

  const fd = new FormData();
  fd.append('vteam', `${vteam}`);
  fd.append('role', `${role}`);
  return genericPost(`/api/v1/team/${teamID}/v`, fd);
}

export function importVteams(mode: string) {
  return genericGet(`/api/v1/team/vbulkimport?mode=${mode}`);
}

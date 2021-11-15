import WasabeeMe from './model/me';
import WasabeeOp from './model/operation';
import { ServerError } from './error';
import type { TaskState } from './model/task';
import type WasabeePortal from './model/portal';
import type WasabeeAgent from './model/agent';
import type WasabeeTeam from './model/team';
import { WasabeeMarker } from './model';

import { getConfig, getServer } from './config';

export default function () {
  return GetWasabeeServer();
}

export function GetWasabeeServer() {
  return getServer();
}

export function GetUpdateList() {
  return getConfig()._updateList;
}

interface IServerStatus {
  status: string;
}

interface IServerUpdate extends IServerStatus {
  updateID: string;
}

/*
On fail, all promises reject an ServerError { code: number, text: string, error?: string }
If http code is 401: request Me.purge (fire wasabee:logout)
On success, it may returns:
 - the requested data as string
 - the requested object
 - true/false (updateOp)
*/

export function loadConfig() {
  return genericGet(`/static/wasabee-webui-config.json`);
}

// returns a promise to /me if the access token is valid
export function SendAccessTokenAsync(accessToken) {
  return genericPost(
    '/aptok',
    JSON.stringify({ accessToken: accessToken }),
    'application/json;charset=UTF-8'
  );
}

// sets logout status on the server; return value is status code
export function logoutPromise() {
  return genericGet('/api/v1/me/logout');
}

// local change: none // cache: none
export function oneTimeToken(token) {
  const url = '/oneTimeToken';
  const fd = new FormData();
  fd.append('token', token);
  return genericPost(url, fd);
}

/**** me & d ****/

// returns a promise to WasabeeMe -- should be called only by WasabeeMe.waitGet()
// use WasabeeMe.cacheGet or WasabeeMe.waitGet for caching
export function mePromise() {
  return genericGet('/api/v1/me');
}

// returns a promise to a list of defensive keys for all enabled teams
export function dKeylistPromise() {
  return genericGet<{
    DefensiveKeys: WDKey[];
  }>('/api/v1/d');
}

// removes the agent from the team; return value is status code
export function leaveTeamPromise(teamID: TeamID) {
  return genericDelete(`/api/v1/me/${teamID}`);
}

// updates an agent's location ; return value is status code
export function locationPromise(lat: number, lng: number) {
  return genericGet(`/api/v1/me?lat=${lat}&lon=${lng}`);
}

export function setIntelID(name: string, faction: string, querytoken: string) {
  const fd = new FormData();
  fd.append('name', name);
  fd.append('faction', faction);
  fd.append('qt', querytoken);
  return genericPut(`/api/v1/me/intelid`, fd);
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

// updates an agent's single defensive key
export function dKeyPromise(json: string) {
  return genericPost('/api/v1/d', json, 'application/json;charset=UTF-8');
}

// many d-keys at once
export function dKeyBulkPromise(json: string) {
  return genericPost('/api/v1/d/bulk', json, 'application/json;charset=UTF-8');
}

/* agent */

// returns a promise to get the agent's JSON data from the server -- should be called only by WasabeeAgent.get()
export function agentPromise(GID: GoogleID) {
  return genericGet<WasabeeAgent>(`/api/v1/agent/${GID}`);
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

/* team */

// returns a promise to a WasabeeTeam -- used only by WasabeeTeam.get
// use WasabeeTeam.get
export function teamPromise(teamid: TeamID) {
  return genericGet<WasabeeTeam>(`/api/v1/team/${teamid}`);
}

export function sendAnnounce(teamID: TeamID, message: string) {
  const fd = new FormData();
  fd.append('m', message);
  return genericPost(`/api/v1/team/${teamID}/announce`, fd);
}

export function pullRocks(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/rocks`);
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

// local change: none // cache: none
export function newTeamPromise(name: string) {
  return genericGet(`/api/v1/team/new?name=${name}`);
}

// local change: none // cache: none
export function renameTeamPromise(teamID: TeamID, name: string) {
  const fd = new FormData();
  fd.append('teamname', name);
  return genericPut(`/api/v1/team/${teamID}/rename`, fd);
}

// local change: none // cache: none
export function deleteTeamPromise(teamID: TeamID) {
  return genericDelete(`/api/v1/team/${teamID}`);
}

export function changeTeamOwnerPromise(teamID: TeamID, newOwner: GoogleID) {
  return genericGet(`/api/v1/team/${teamID}/chown?to=${newOwner}`);
}

// local change: none // cache: none
export function addAgentToTeamPromise(agentID: GoogleID, teamID: TeamID) {
  return genericPost(`/api/v1/team/${teamID}/${agentID}`, new FormData());
}

// removes another agent from an owned team ; return value is status code
export function removeAgentFromTeamPromise(agentID: GoogleID, teamID: TeamID) {
  return genericDelete(`/api/v1/team/${teamID}/${agentID}`);
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
export function setAgentTeamSquadPromise(
  agentID: GoogleID,
  teamID: TeamID,
  squad: string
) {
  const fd = new FormData();
  fd.append('squad', squad);
  return genericPost(`/api/v1/team/${teamID}/${agentID}/squad`, fd);
}

export function createJoinLinkPromise(teamID: TeamID) {
  return genericGet<{ Key: string }>(`/api/v1/team/${teamID}/genJoinKey`);
}

export function deleteJoinLinkPromise(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/delJoinKey`);
}

// returns a promise to fetch a WasabeeOp
// local change: If the server's copy is newer than the local copy, otherwise none
// not generic since 304 result processing and If-Modified-Since header
export async function opPromise(opID: OpID) {
  let ims = 'Sat, 29 Oct 1994 19:43:31 GMT'; // the dawn of time...
  const localop = WasabeeOp.load(opID);
  if (localop != null && localop.fetched) ims = localop.fetched;

  try {
    const raw = await generic<WasabeeOp>({
      url: `/api/v1/draw/${opID}`,
      method: "GET",
      headers: localop
        ? localop.lasteditid
          ? {
              "If-None-Match": localop.lasteditid,
            }
          : {
              "If-Modified-Since": ims,
            }
        : null,
    });

    const newop = new WasabeeOp(raw);
    //newop.localchanged = false;
    //newop.server = GetWasabeeServer();
    //newop.fetchedOp = JSON.stringify(raw);
    return newop;
  } catch (e) {
    if (!(e instanceof ServerError)) {
      // unexpected error
      console.error(e);
      return Promise.reject(
        new ServerError({
          code: -1,
          text: `Unexpected error: ${e}`,
        })
      );
    }
    switch (e.code) {
      case 304:
        //localop.server = GetWasabeeServer();
        return localop;
      case 403:
      // fallthrough
      case 410:
        WasabeeOp.delete(opID);
      // fallthrough
      default:
        return Promise.reject(e);
    }
  }
}

// sends a changed op to the server
export async function updateOpPromise(operation: WasabeeOp) {
  const json = JSON.stringify(operation.toServer());

  try {
    const update = await generic<IServerUpdate>({
      url: `/api/v1/draw/${operation.ID}`,
      method: "PUT",
      body: json,
      headers: operation.lasteditid
        ? {
            "Content-Type": "application/json;charset=UTF-8",
            "If-Match": operation.lasteditid,
          }
        : {
            "Content-Type": "application/json;charset=UTF-8",
          },
    });
    operation.lasteditid = update.updateID;
    //operation.remoteChanged = false;
    operation.fetched = new Date().toUTCString();
    //operation.fetchedOp = JSON.stringify(operation);
    return true;
  } catch (e) {
    if (!(e instanceof ServerError)) {
      // unexpected error
      console.error(e);
      return Promise.reject(
        new ServerError({
          code: -1,
          text: `Unexpected error: ${e}`,
        })
      );
    }
    switch (e.code) {
      case 412:
        return false;
      // break;
      case 410:
        WasabeeOp.delete(operation.ID);
      // fallthrough
      default:
        return Promise.reject(e);
    }
  }
}

// removes an op from the server
export function deleteOpPromise(opID: OpID) {
  return genericDelete(`/api/v1/draw/${opID}`);
}

export function setOpInfo(opID: OpID, info: string) {
  const fd = new FormData();
  fd.append('info', info);
  return genericPost(`/api/v1/draw/${opID}/info`, fd);
}

// adds a permission to an op; return value is status code
export function addPermPromise(
  opID: OpID,
  teamID: TeamID,
  role: string,
  zone: ZoneID
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
  role: string,
  zone: ZoneID
) {
  const fd = new FormData();
  fd.append('team', teamID);
  fd.append('role', role);
  fd.append('zone', `${zone}`);
  return genericDelete(`/api/v1/draw/${opID}/perms`, fd);
}

// local change: none // cache: none
export function assignMarkerPromise(
  opID: OpID,
  markerID: MarkerID,
  agentID: GoogleID
) {
  const fd = new FormData();
  fd.append('agent', agentID);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/assign`, fd);
}

// performs a link assignment on the server, sending notifications
export function assignLinkPromise(opID: OpID, linkID: LinkID, agentID) {
  const fd = new FormData();
  fd.append('agent', agentID);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/assign`, fd);
}

// changes a markers status on the server, sending relevant notifications
export function SetMarkerState(
  opID: OpID,
  markerID: MarkerID,
  state: TaskState
) {
  let action: 'incomplete' | 'acknowledge' | 'complete' = 'incomplete';
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
export function SetLinkState(opID: OpID, linkID: LinkID, state: TaskState) {
  let action: 'incomplete' | 'acknowledge' | 'complete' = 'incomplete';
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

export function reverseLinkDirection(opID: OpID, linkID: LinkID) {
  return genericGet(`/api/v1/draw/${opID}/link/${linkID}/swap`);
}

export function setMarkerComment(
  opID: OpID,
  markerID: MarkerID,
  comment: string
) {
  const fd = new FormData();
  fd.append('comment', comment);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/comment`, fd);
}

export function setLinkComment(opID: OpID, linkID: LinkID, desc: string) {
  const fd = new FormData();
  fd.append('desc', desc);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/desc`, fd);
}

export function setLinkZone(opID: OpID, linkID: LinkID, zone: ZoneID) {
  const fd = new FormData();
  fd.append('zone', `${zone}`);
  return genericPost(`/api/v1/draw/${opID}/link/${linkID}/zone`, fd);
}

export function setMarkerZone(opID: OpID, markerID: MarkerID, zone: ZoneID) {
  const fd = new FormData();
  fd.append('zone', `${zone}`);
  return genericPost(`/api/v1/draw/${opID}/marker/${markerID}/zone`, fd);
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

export function sendTokenToWasabee(token: string) {
  // no need for a form-data, just send the raw token
  return genericPost(`/api/v1/me/firebase`, token);
}

export function getCustomTokenFromServer() {
  return generic({
    url: `/api/v1/me/firebase`,
    method: 'GET',
    raw: true,
  });
}

/* generic method */
/**
 * Generic fetch method against wasabee server
 */
async function generic<T>(request: {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: FormData | string;
  headers?: HeadersInit;
  raw?: boolean;
  retried?: boolean;
}): Promise<T> {
  const requestInit: RequestInit = {
    method: request.method,
    mode: 'cors',
    cache: 'default',
    credentials: 'include',
    redirect: 'manual',
    referrerPolicy: 'origin',
  };
  if (request.body) requestInit.body = request.body;
  if (request.headers) requestInit.headers = request.headers;

  try {
    const response = await fetch(GetWasabeeServer() + request.url, requestInit);
    /** @type Object | string */
    const payload: string = await response.text();

    let jsonPayload;
    if (!request.raw) {
      if (!payload && !request.retried && response.ok) {
        // server shouldn't reply empty string
        console.warn(
          `server answers is empty on[${request.url}], retry once, just in case `
        );
        return generic<T>({ ...request, retried: true });
      }
      try {
        jsonPayload = JSON.parse(payload);
      } catch {
        if (response.ok)
          return Promise.reject(
            new ServerError({
              code: -1,
              text: 'unexpected server answer',
            })
          );
      }
    }

    switch (response.status) {
      case 200:
        if (!request.raw && jsonPayload.updateID)
          GetUpdateList().set(jsonPayload.updateID, Date.now());
        return Promise.resolve((request.raw ? payload : jsonPayload) as T);
      // break;
      case 401:
        WasabeeMe.purge();
      // fallthrough;
      case 403: // forbidden
      // fallthrough
      case 410: // Gone
      // fallthrough
      case 412: // mismatch etag
      // fallthrough
      case 304: // If-None-Match or If-Modified-Since replied NotModified
      // fallthrough;
      default:
        return Promise.reject(
          new ServerError({
            code: response.status,
            text: response.statusText,
            error: jsonPayload ? jsonPayload.error : null,
          })
        );
    }
  } catch (e) {
    console.error(e);
    return Promise.reject(
      new ServerError({
        code: -1,
        text: 'Network error',
      })
    );
  }
}

function genericGet<T>(url: string) {
  return generic<T>({
    method: 'GET',
    url: url,
  });
}

function genericPost<T>(
  url: string,
  formData: FormData | string,
  contentType?: string
) {
  return generic<T>({
    url: url,
    method: 'POST',
    body: formData,
    headers: contentType ? { 'Content-Type': contentType } : null,
  });
}

function genericPut<T>(url: string, formData: FormData) {
  return generic<T>({
    url: url,
    method: 'PUT',
    body: formData,
  });
}

function genericDelete<T>(url: string, formData?: FormData) {
  return generic<T>({
    url: url,
    method: 'DELETE',
    body: formData,
  });
}

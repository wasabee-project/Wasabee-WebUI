import WasabeeMe from './model/me';
import WasabeeOp from './model/operation';
import { ServerError } from './error';
import type { TaskState } from './model/task';
import type WasabeeLink from './model/portal';
import type WasabeePortal from './model/portal';
import type WasabeeAgent from './model/agent';
import type WasabeeTeam from './model/team';
import type { ITask } from './model/task';
import { WasabeeMarker } from './model';

import { getConfig, getServer } from './config';
import { getAuthBearer } from './auth';
import { dismissUpdateID } from './notify';

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

export async function updateOpIDOnSuccess(
  operation: WasabeeOp,
  promise: Promise<IServerUpdate>
) {
  const update = await promise;
  operation.lasteditid = update.updateID;
  operation.store();
  return update;
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
  return genericGet<any>(`/static/wasabee-webui-config.json`);
}

// returns a promise to /me if the access token is valid
export function SendAccessTokenAsync(accessToken: string) {
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
export function oneTimeToken(token: string) {
  const url = '/oneTimeToken';
  const fd = new FormData();
  fd.append('token', token);
  return genericPost(url, fd);
}

/**** me & d ****/

// returns a promise to WasabeeMe -- should be called only by WasabeeMe.waitGet()
// use WasabeeMe.cacheGet or WasabeeMe.waitGet for caching
export function mePromise() {
  return genericGet<WasabeeMe>('/api/v1/me');
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

export function joinTeamPromise(teamID: TeamID, token: string) {
  return genericGet<IServerStatus>(`/api/v1/team/${teamID}/join/${token}`);
}

export function sendAnnounce(teamID: TeamID, message: string) {
  const fd = new FormData();
  fd.append('m', message);
  return genericPost(`/api/v1/team/${teamID}/announce`, fd);
}

export function pullRocks(teamID: TeamID) {
  return genericGet(`/api/v1/team/${teamID}/rocks`);
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
export function setAgentTeamCommentPromise(
  agentID: GoogleID,
  teamID: TeamID,
  comment: string
) {
  const fd = new FormData();
  fd.append('squad', comment);
  return genericPost(`/api/v1/team/${teamID}/${agentID}/comment`, fd);
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
      method: 'GET',
      headers: localop
        ? localop.lasteditid
          ? {
              'If-None-Match': localop.lasteditid,
            }
          : {
              'If-Modified-Since': ims,
            }
        : undefined,
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
        return localop as WasabeeOp;
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
      method: 'PUT',
      body: json,
      headers: operation.lasteditid
        ? {
            'Content-Type': 'application/json;charset=UTF-8',
            'If-Match': operation.lasteditid,
          }
        : {
            'Content-Type': 'application/json;charset=UTF-8',
          },
    });
    operation.lasteditid = update.updateID;
    //operation.remoteChanged = false;
    operation.fetched = new Date().toUTCString();
    //operation.fetchedOp = JSON.stringify(operation);
    return update;
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

export function getLinkPromise(opID: OpID, taskID: TaskID) {
  return genericGet<WasabeeLink>(`/api/v1/draw/${opID}/link/${taskID}`);
}

export function getMarkerPromise(opID: OpID, taskID: TaskID) {
  return genericGet<WasabeeMarker>(`/api/v1/draw/${opID}/marker/${taskID}`);
}

// tasks

export function taskGetPromise(opID: OpID, taskID: TaskID) {
  return genericGet<ITask>(`/api/v1/draw/${opID}/task/${taskID}`);
}

export function taskOrderPromise(opID: OpID, taskID: TaskID, order: number) {
  const fd = new FormData();
  fd.append('order', `${order}`);
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/order`,
    fd
  );
}

export function taskAssignPromise(
  opID: OpID,
  taskID: TaskID,
  gids: GoogleID[]
) {
  const fd = new FormData();
  for (const gid of gids) {
    fd.append('agent', gid);
  }
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/assign`,
    fd
  );
}

export function taskDeleteAssignPromise(opID: OpID, taskID: TaskID) {
  return genericDelete<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/assign`
  );
}

export function taskCommentPromise(
  opID: OpID,
  taskID: TaskID,
  comment: string
) {
  const fd = new FormData();
  fd.append('comment', comment);
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/comment`,
    fd
  );
}

export function taskCompletePromise(
  opID: OpID,
  taskID: TaskID,
  complete: boolean
) {
  const action = complete ? 'complete' : 'incomplete';
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/${action}`
  );
}

export function taskAckPromise(opID: OpID, taskID: TaskID) {
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/acknowledge`
  );
}

export function taskRejectPromise(opID: OpID, taskID: TaskID) {
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/reject`
  );
}

export function taskClaimPromise(opID: OpID, taskID: TaskID) {
  return genericPut<IServerUpdate>(`/api/v1/draw/${opID}/task/${taskID}/claim`);
}

export function taskZonePromise(opID: OpID, taskID: TaskID, zone: ZoneID) {
  const fd = new FormData();
  fd.append('zone', `${zone}`);
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/zone`,
    fd
  );
}

export function taskDeltaPromise(opID: OpID, taskID: TaskID, delta: number) {
  const fd = new FormData();
  fd.append('delta', `${delta}`);
  return genericPut<IServerUpdate>(`/api/v1/draw/${opID}/task/${taskID}/delta`);
}

export function taskAddDependPromise(opID: OpID, taskID: TaskID, dep: TaskID) {
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/depend/${dep}`
  );
}

export function taskDelDependPromise(opID: OpID, taskID: TaskID, dep: TaskID) {
  return genericDelete<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${taskID}/depend/${dep}`
  );
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
export function assignLinkPromise(
  opID: OpID,
  linkID: LinkID,
  agentID: GoogleID
) {
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
  object: ITask,
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

export function addTaskDepend(opID: OpID, task: ITask, dep: TaskID) {
  return genericPut<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${task.ID}/depend/${dep}`
  );
}
export function deleteTaskDepend(opID: OpID, task: ITask, dep: TaskID) {
  return genericDelete<IServerUpdate>(
    `/api/v1/draw/${opID}/task/${task.ID}/depend/${dep}`
  );
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
  return generic<string>({
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
    headers: {},
  };
  if (request.body) requestInit.body = request.body;
  if (request.headers) requestInit.headers = request.headers;

  // use jwt instead of cookies if available
  const bearer = getAuthBearer();
  if (bearer) {
    // @ts-ignore requestInit.headers might be undefined
    requestInit.headers['Authorization'] = `Bearer ${bearer}`;
    requestInit.credentials = 'omit';
  }

  try {
    const response = await fetch(GetWasabeeServer() + request.url, requestInit);
    /** @type Object | string */
    const payload: string = await response.text();

    let jsonPayload: any;
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
        if (!request.raw && jsonPayload.updateID) {
          GetUpdateList().set(jsonPayload.updateID, Date.now());
          dismissUpdateID(jsonPayload.updateID);
        }
        return Promise.resolve((request.raw ? payload : jsonPayload) as T);
      // break;
      case 302:
      // fallthrough;
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
    headers: contentType ? { 'Content-Type': contentType } : undefined,
  });
}

function genericPut<T>(url: string, formData?: FormData) {
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

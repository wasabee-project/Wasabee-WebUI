import { setServer } from './config';
import { SendAccessTokenAsync } from './server';

function promiseLogin(options: gapi.auth2.AuthorizeConfig) {
  const promise = new Promise<string>((resolve, reject) => {
    window.gapi.auth2.authorize(options, (response) => {
      if (response.error) {
        return reject(`error: ${response.error}: ${response.error_subtype}`);
      }
      console.log(response);
      resolve(response.access_token);
    });
  });
  return promise;
}

const BEARER_KEY = 'wasabee-bearer';
let bearer: string = localStorage[BEARER_KEY];

let authStatus = false;
// looks wrong
export function isAuth() {
  return authStatus;
}

export function setAuthStatus(b: boolean) {
  authStatus = b;
  if (!b) setAuthBearer(null);
}

export function getAuthBearer() {
  return bearer;
}

export function setAuthBearer(jwt?: string) {
  bearer = jwt;
  if (jwt) localStorage[BEARER_KEY] = jwt;
  else delete localStorage[BEARER_KEY];
}

export async function login(server: string, selectAccount) {
  const options = {
    client_id:
      '269534461245-rpgijdorh2v0tdalis1s95fkebok73cl.apps.googleusercontent.com',
    scope: 'email profile openid',
    response_type: 'id_token permission',
    prompt: selectAccount ? 'select_account' : 'none',
  };
  let token: string;
  try {
    token = await promiseLogin(options);
  } catch {
    // no quick login
  }
  if (!token && options.prompt != 'select_account') {
    options.prompt = 'select_account';
    try {
      token = await promiseLogin(options);
    } catch {
      console.warn('fail to login to google');
    }
  }
  if (token) {
    setServer(server);
    const me: any = await SendAccessTokenAsync(token);
    if (me.jwt) setAuthBearer(me.jwt);
    return me;
  }
  return null;
}

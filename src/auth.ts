import { setServer } from './config';
import { SendAccessTokenAsync } from './server';

function promiseLogin(options: gapi.auth2.AuthorizeConfig) {
  const promise = new Promise<string>((resolve, reject) => {
    window.gapi.auth2.authorize(options, (response) => {
      if (response.error) {
        return reject(
          `error: ${response.error}: ${
            response.error_subtype || (response as any).details
          }`
        );
      }
      resolve(response.access_token);
    });
  });
  return promise;
}

const BEARER_KEY = 'wasabee-bearer';
let bearer: string = localStorage[BEARER_KEY];

export function getAuthBearer() {
  return bearer;
}

export function setAuthBearer(jwt?: string) {
  bearer = jwt;
  if (jwt) localStorage[BEARER_KEY] = jwt;
  else delete localStorage[BEARER_KEY];
}

export async function login(server: string, selectAccount: boolean) {
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
  } catch (e) {
    // no quick login
    console.warn('fail to login to google', e);
  }
  if (!token && options.prompt != 'select_account') {
    options.prompt = 'select_account';
    try {
      token = await promiseLogin(options);
    } catch (e) {
      console.warn('fail to login to google', e);
    }
  }
  if (token) {
    setServer(server);
    try {
      const me: any = await SendAccessTokenAsync(token);
      if (me.jwt) setAuthBearer(me.jwt);
      return me;
    } catch (e) {
      // reset auth bearer (likely not supported by current server)
      setAuthBearer();
    }
  }
  return null;
}

import { setServer } from './config';
import { SendAccessTokenAsync } from './server';

let googleClient: google.accounts.oauth2.TokenClient;
let loginCallback: (_: google.accounts.oauth2.TokenResponse) => void;

export function initGoogleLogin() {
  googleClient = google.accounts.oauth2.initTokenClient({
    client_id: '269534461245-rpgijdorh2v0tdalis1s95fkebok73cl.apps.googleusercontent.com',
    scope: "email profile openid",
    callback: (response) => {
      if (!loginCallback) return;
      loginCallback(response);
      loginCallback = null;
    },
  });
}

function promiseLogin(options: google.accounts.oauth2.OverridableTokenClientConfig) {
  const promise = new Promise<string>((resolve, reject) => {
    loginCallback = (response) => {
      if (response.error) {
        return reject(
          `error: ${response.error}: ${
            response.error_description || response.error_uri
          }`
        );
      }
      resolve(response.access_token);
    };
    googleClient.requestAccessToken(options);
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
    scope: 'email profile openid',
    prompt: selectAccount ? 'select_account' : null,
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
      return Promise.reject({
        reason: 'Failed to login to google',
        message: e,
        cause: 'google',
      });
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
      return Promise.reject({
        reason: 'Failed to login to Wasabee',
        message: e,
        cause: 'wasabee',
      });
    }
  }
  return null;
}

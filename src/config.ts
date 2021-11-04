let config: { [key: string]: any } = null;

let server = 'https://am.wasabee.rocks';

export function setConfig(c) {
  config = c;
}

export function getConfig() {
  return config;
}

export function setServer(s) {
  server = s;
}

export function getServer() {
  return server;
}

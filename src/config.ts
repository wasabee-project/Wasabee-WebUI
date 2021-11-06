let config: { [key: string]: any } = null;

const SERVER_KEY = 'wasabee-server';
let server: string = localStorage[SERVER_KEY] || 'https://am.wasabee.rocks';

export function setConfig(c) {
  config = c;
  config._updateList = new Map();
}

export function getConfig() {
  return config;
}

export function setServer(s) {
  server = s;
  localStorage[SERVER_KEY] = s;
}

export function getServer() {
  return server;
}

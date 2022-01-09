let config: { [key: string]: any } = null;

const SERVER_KEY = 'wasabee-server';
let server: string = localStorage[SERVER_KEY] || 'https://am.wasabee.rocks';

const SERVERS_KEY = 'wasabee-servers';
const servers = [
  {
    name: 'Americas Server',
    url: 'https://am.wasabee.rocks',
  },
  {
    name: 'EU Server',
    url: 'https://eu.wasabee.rocks',
  },
  {
    name: 'Asia/Pacific Server',
    url: 'https://ap.wasabee.rocks',
  },
];

try {
  const ss = JSON.parse(localStorage.getItem(SERVERS_KEY));
  for (const server of ss) {
    if (!servers.find((s) => s.url === server.url)) servers.push(server);
  }
} catch (e) {
  console.error(e);
}

const urlParams = new URLSearchParams(window.location.search);
const urlServer = urlParams.get('server');

if (urlServer) {
  if (!servers.find((s) => s.url === urlServer)) {
    servers.push({
      name: urlServer,
      url: urlServer,
    });
  }
  setServer(urlServer);
}

localStorage[SERVERS_KEY] = JSON.stringify(servers);

// drop query parameters
window.history.pushState(
  {},
  document.title,
  window.location.pathname + window.location.hash
);

export function getServers() {
  return servers;
}

export function setConfig(c: any) {
  config = c;
  config._updateList = new Map();
}

export function getConfig() {
  return config;
}

export function setServer(s: string) {
  server = s;
  localStorage[SERVER_KEY] = s;
}

export function getServer() {
  return server;
}

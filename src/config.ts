let config: { [key: string]: any } = null;

export function setConfig(c) {
  config = c;
}

export function getConfig() {
  return config;
}

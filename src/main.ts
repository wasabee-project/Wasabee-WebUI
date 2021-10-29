import 'leaflet';
import App from './App.svelte';

import { loadConfig } from './server';
import { setConfig } from './config';

(async () => {
  const config = await loadConfig();
  config._updateList = new Map();
  setConfig(config);
  // @ts-ignore
  new App({
    target: document.body,
  });
  const footer = document.querySelector('footer');
  footer.parentElement.appendChild(footer);
})();

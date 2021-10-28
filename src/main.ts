import 'leaflet';
import App from './App.svelte';

import { loadConfig } from './server';

(async () => {
  (window as any).wasabeewebui = await loadConfig();
  (window as any).wasabeewebui._updateList = new Map();
  // @ts-ignore
  new App({
    target: document.body,
  });
  const footer = document.querySelector('footer');
  footer.parentElement.appendChild(footer);
})();

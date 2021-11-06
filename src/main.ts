import 'leaflet';
import App from './App.svelte';

(async () => {
  // @ts-ignore
  new App({
    target: document.body,
  });
  const footer = document.querySelector('footer');
  footer.parentElement.appendChild(footer);
})();

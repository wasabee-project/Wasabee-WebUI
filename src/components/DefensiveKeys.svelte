<script lang="ts">
  import Router from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';
  import { wrap } from 'svelte-spa-router/wrap';
  import { writable } from 'svelte/store';

  import DefensiveKeysList from './DefensiveKeys/List.svelte';
  import DefensiveKeysMap from './DefensiveKeys/Map.svelte';

  import { dKeylistPromise } from '../server';

  let dKeysStore = writable<WDKey[]>(null);
  let dKeys: WDKey[] = [];

  $: dKeysStore.set(dKeys);

  const routes = {
    '/map': wrap({
      component: DefensiveKeysMap,
      props: {
        dKeysStore: dKeysStore,
      },
    }),
    '*': wrap({
      component: DefensiveKeysList,
      props: {
        dKeysStore: dKeysStore,
      },
    }),
  };

  function refresh() {
    dKeylistPromise().then((j) => {
      dKeys = j.DefensiveKeys || [];
    });
  }

  function onRouteEvent(event: any) {
    if (event.detail && 'refresh' in event.detail) {
      refresh();
    }
  }

  refresh();
</script>

<ul class="nav nav-tabs">
  <li class="nav-item">
    <a class="nav-link" use:active href="#/defensivekeys/list">Checklist</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" use:active href="#/defensivekeys/map">Map</a>
  </li>
  <button class="btn btn-primary" on:click={() => refresh()}>↻</button>
</ul>

<div class="container">
  <Router prefix="/defensivekeys" {routes} on:routeEvent={onRouteEvent} />
</div>

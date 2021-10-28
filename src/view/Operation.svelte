<script lang="ts">
  import Router from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  import OperationChecklist from './OperationChecklist.svelte';
  import OperationKeys from './OperationKeys.svelte';
  import OperationManage from './OperationManage.svelte';
  import OperationMap from './OperationMap.svelte';
  import OperationPermissions from './OperationPermissions.svelte';

  import { wrap } from 'svelte-spa-router/wrap';
  import { writable } from 'svelte/store';

  import WasabeeMe from '../model/me';
  import WasabeeOp from '../model/operation';

  import { opPromise } from '../server';

  export let params: any = {};
  let opid = params.opid;
  let prefix = '/operation/' + opid;

  let me = WasabeeMe.get();

  let opStore = writable<WasabeeOp>(null);
  let operation = WasabeeOp.load(opid);

  $: opStore.set(operation);

  function refresh() {
    opPromise(opid).then((op) => {
      operation = op;
    });
  }

  refresh();

  function mayWrite(me: WasabeeMe, operation: WasabeeOp) {
    if (me.id === operation.creator) return true;
    const writers = operation.teamlist
      .filter((t) => t.role === 'write')
      .map((t) => t.teamid);
    return me.Teams.some((t) => writers.includes(t.ID));
  }

  $: canWrite = operation ? mayWrite(me, operation) : false;

  const routes = {
    '/list': wrap({
      component: OperationChecklist,
      props: {
        opStore: opStore,
        assignmentsOnly: false,
      },
    }),
    '/assignments': wrap({
      component: OperationChecklist,
      props: {
        opStore: opStore,
        assignmentsOnly: true,
      },
    }),
    '/permissions': wrap({
      component: OperationPermissions,
      props: {
        opStore: opStore,
      },
    }),
    '/map': wrap({
      component: OperationMap,
      props: {
        opStore: opStore,
      },
    }),
    '/keys': wrap({
      component: OperationKeys,
      props: {
        opStore: opStore,
      },
    }),
    '/manage': wrap({
      component: OperationManage,
      props: {
        opStore: opStore,
      },
    }),
  };

  function onRouteEvent(event: any) {
    if (event.detail && 'refresh' in event.detail) {
      refresh();
    }
  }
</script>

<ul class="nav nav-tabs">
  <li class="nav-item">
    <a class="nav-link" use:active href={'#/operation/' + opid + '/list'}
      >Checklist</a
    >
  </li>
  <li class="nav-item">
    <a class="nav-link" use:active href={'#/operation/' + opid + '/assignments'}
      >Assignments</a
    >
  </li>
  <li class="nav-item">
    <a class="nav-link" use:active href={'#/operation/' + opid + '/map'}>Map</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" use:active href={'#/operation/' + opid + '/keys'}
      >Keys</a
    >
  </li>
  {#if canWrite}
    <li class="nav-item">
      <a class="nav-link" use:active href={'#/operation/' + opid + '/manage'}
        >Manage</a
      >
    </li>
    <li class="nav-item">
      <a
        class="nav-link"
        use:active
        href={'#/operation/' + opid + '/permissions'}>Permissions</a
      >
    </li>
  {/if}
  <button class="btn btn-primary" on:click={() => refresh()}>↻</button>
</ul>

<div class="container">
  {#if operation}
    <Router {prefix} {routes} on:routeEvent={onRouteEvent} />
  {/if}
</div>

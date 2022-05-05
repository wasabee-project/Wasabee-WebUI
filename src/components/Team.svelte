<script lang="ts">
  import Router from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  import TeamJoin from './Team/Join.svelte';
  import TeamList from './Team/List.svelte';
  import TeamManage from './Team/Manage.svelte';
  import TeamAgentMap from './Team/AgentMap.svelte';
  import TeamSettings from './Team/Settings.svelte';

  import { wrap } from 'svelte-spa-router/wrap';
  import { writable } from 'svelte/store';

  import type WasabeeTeam from '../model/team';
  import WasabeeMe from '../model/me';

  import { getTeam } from '../cache';

  export let params: any = {};
  let teamid = params.teamid;
  let prefix = '/team/' + teamid;

  let me = WasabeeMe.get();

  let teamStore = writable<WasabeeTeam>(null);
  let team: WasabeeTeam = null;

  $: teamStore.set(team);

  getTeam(teamid).then((t) => (team = t));

  $: isOwner = team
    ? me.Teams.some((team) => team.ID == teamid && team.Owner == me.id)
    : false;

  const routes = {
    '/list': wrap({
      component: TeamList,
      props: {
        teamStore: teamStore,
      },
    }),
    '/map': wrap({
      component: TeamAgentMap,
      props: {
        teamStore: teamStore,
      },
    }),
    '/settings': wrap({
      component: TeamSettings,
      props: {
        teamStore: teamStore,
      },
    }),
    '/manage': wrap({
      component: TeamManage,
      props: {
        teamStore: teamStore,
      },
    }),
    '/join/:token': wrap({
      component: TeamJoin,
      props: {
        teamid: teamid,
      },
    }),
  };

  function onRouteEvent(event: any) {
    if (event.detail && 'refresh' in event.detail) {
      refresh(event.detail.refresh);
    }
  }

  function refresh(force = true) {
    getTeam(teamid, force ? 0 : 10).then((t) => {
      team = t;
    });
  }
</script>

<ul class="nav nav-tabs">
  <li class="nav-item">
    <a class="nav-link" use:active href={'#/team/' + teamid + '/list'}>List</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" use:active href={'#/team/' + teamid + '/map'}>Map</a>
  </li>
  {#if isOwner}
    <li class="nav-item">
      <a class="nav-link" use:active href={'#/team/' + teamid + '/manage'}
        >Manage</a
      >
    </li>
    <li class="nav-item">
      <a class="nav-link" use:active href={'#/team/' + teamid + '/settings'}
        >Settings</a
      >
    </li>
  {/if}
  <button class="btn btn-primary" on:click={() => refresh()}>↻</button>
</ul>

<div class="container">
  <Router {prefix} {routes} on:routeEvent={onRouteEvent} />
</div>

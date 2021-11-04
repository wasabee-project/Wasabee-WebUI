<script lang="ts">
  import { clearOpsStorage, loadMeAndOps } from './sync';
  import { WasabeeMe } from './model';

  let me: WasabeeMe | null;

  // initial sync
  loadMeAndOps().then(() => (me = WasabeeMe.get()));

  import Router from 'svelte-spa-router';

  import Help from './view/Help.svelte';
  import Operations from './view/Operations.svelte';
  import Settings from './view/Settings.svelte';
  import Teams from './view/Teams.svelte';

  import DefensiveKeys from './view/DefensiveKeys.svelte';
  import Team from './view/Team.svelte';
  import Operation from './view/Operation.svelte';

  import { logoutPromise } from './server';

  import {
    Collapse,
    Navbar,
    NavbarToggler,
    Nav,
    NavItem,
    NavLink,
  } from 'sveltestrap';

  const routes = {
    // Exact path
    '/': Teams,
    '/teams': Teams,
    '/operations': Operations,
    '/settings': Settings,
    '/help': Help,

    '/defensivekeys/*': DefensiveKeys,
    '/team/:teamid/*': Team,
    '/operation/:opid/*': Operation,
  };

  async function logout() {
    // clear all ops
    clearOpsStorage();
    try {
      await logoutPromise();
    } catch (e) {
      console.log(e);
    }
    WasabeeMe.purge();
    delete localStorage['sentToServer'];
    window.location.href = '/';
  }
</script>

<header>
  <Navbar container={false} color="dark" dark expand="lg">
    <NavbarToggler id="main-toggler" />
    <Collapse toggler="#main-toggler" navbar expand="lg">
      <Nav navbar>
        <NavItem><NavLink href="#/teams">Teams</NavLink></NavItem>
        <NavItem><NavLink href="#/operations">Operations</NavLink></NavItem>
        <NavItem
          ><NavLink href="#/defensivekeys/">Defensive keys</NavLink></NavItem
        >
        <NavItem><NavLink href="#/settings">Settings</NavLink></NavItem>
        <NavItem><NavLink href="#/help">Help</NavLink></NavItem>
        <NavItem><NavLink href="#/" on:click={logout}>Log out</NavLink></NavItem
        >
      </Nav>
    </Collapse>
  </Navbar>
</header>
<main>
  {#if me}
    <Router {routes} />
  {/if}
</main>

<style>
</style>

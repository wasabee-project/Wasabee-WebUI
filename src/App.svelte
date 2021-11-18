<script lang="ts">
  import Router from 'svelte-spa-router';
  import { fade } from 'svelte/transition';
  import { ToastContainer, FlatToast } from 'svelte-toasts';

  import {
    Collapse,
    Navbar,
    NavbarToggler,
    Nav,
    NavItem,
    NavLink,
  } from 'sveltestrap';

  import Help from './view/Help.svelte';
  import HomePage from './view/HomePage.svelte';
  import Operations from './view/Operations.svelte';
  import Settings from './view/Settings.svelte';
  import Teams from './view/Teams.svelte';

  import DefensiveKeys from './view/DefensiveKeys.svelte';
  import Operation from './view/Operation.svelte';
  import Team from './view/Team.svelte';

  import { setConfig } from './config';

  import { clearOpsStorage, loadMeAndOps, syncOps, syncTeams } from './sync';
  import { loadConfig, logoutPromise } from './server';

  import { WasabeeMe } from './model';

  let me: WasabeeMe | null;

  let loading = true;

  // try use last used server
  (async () => {
    setConfig(await loadConfig());
    loadMeAndOps()
      .then(async () => {
        me = WasabeeMe.get();
        loading = false;
      })
      .catch(() => {
        loading = false;
      });
  })();

  $: if (me) loading = false;

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
    //window.location.href = '/';
    me = null;
  }

  let disabled = true;
  function loadAuth2() {
    window.gapi.load('auth2', () => {
      disabled = false;
    });
  }
  async function onLogin(ev) {
    me = new WasabeeMe(ev.detail);
    me.store();
    setConfig(await loadConfig());
    await syncOps(me);
    await syncTeams(me);
  }
</script>

<svelte:head>
  <script
    src="https://apis.google.com/js/api.js"
    async
    defer
    on:load={loadAuth2}></script>
</svelte:head>

{#if !me}
  <HomePage on:login={onLogin} {disabled} />
{:else}
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
          <NavItem
            ><NavLink href="#/" on:click={logout}>Log out</NavLink></NavItem
          >
        </Nav>
      </Collapse>
    </Navbar>
  </header>
  <main in:fade={{ duration: 500 }}>
    <ToastContainer let:data>
      <FlatToast {data} />
    </ToastContainer>
    <Router {routes} />
  </main>
{/if}

{#if loading}
  <div id="loading-animation" />
{/if}

<footer class="mastfoot mx-5 mt-auto">
  <div class="p-5">
    <p class="text-muted small">
      This site uses cookies for authentication purposes. You may opt into
      location tracking; your location and other information will be shared <strong
        >only</strong
      >
      with members of your teams. Your ENL information is verified with
      <a href="https://v.enl.one/">V</a> and
      <a href="https://enl.rocks">.rocks</a>. Please see the
      <a href="/privacy">Privacy Policy</a> for more information.
    </p>
    <p class="text-muted text-right small">
      Copyright &copy; The Wasabee Team 2021. All Rights Reserved
    </p>
  </div>
</footer>

<style>
  :global(html),
  :global(body) {
    height: 100%;
  }
  :global(body) {
    display: flex;
    flex-direction: column;
  }
  #loading-animation {
    background-image: url(https://cdn2.wasabee.rocks/img/bee.svg);
    background-size: cover;
    background-position-x: 34%;
    width: 10rem;
    height: 10rem;
    animation: spinner-border 0.9s ease infinite;
    position: absolute;
    top: calc(50vh - 5rem);
    left: calc(50vw - 5rem);
    z-index: 10;
  }
</style>

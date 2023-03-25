<script lang="ts">
  import Router, { location, replace } from 'svelte-spa-router';
  import { fade } from 'svelte/transition';
  import { ToastContainer, FlatToast } from 'svelte-toasts';

  import {
    Collapse,
    Navbar,
    NavbarToggler,
    Nav,
    NavItem,
    NavLink,
    Input,
  } from 'sveltestrap';

  import Help from './components/Help.svelte';
  import HomePage from './components/HomePage.svelte';
  import Operations from './components/Operations.svelte';
  import Settings from './components/Settings.svelte';
  import Teams from './components/Teams.svelte';

  import DefensiveKeys from './components/DefensiveKeys.svelte';
  import Operation from './components/Operation.svelte';
  import Team from './components/Team.svelte';

  import { getServer, getServers, setConfig, setServer } from './config';

  import { clearOpsStorage, loadMeAndOps } from './sync';
  import { loadConfig, logoutPromise } from './server';

  import { WasabeeMe } from './model';
  import { getAuthBearer, initGoogleLogin, setAuthBearer } from './auth';

  import { sendTokenToServer } from './firebase';
  import { meStore, opsStore, teamsStore } from './stores';

  let me: WasabeeMe | null;

  let loading = false;

  // try use last used server
  if (getAuthBearer()) {
    loading = true;
    loadConfig()
      .then((config) => {
        setConfig(config);
        loadMeAndOps()
          .then(async () => {
            me = WasabeeMe.get();
            sendTokenToServer();
            loading = false;
          })
          .catch(() => {
            setAuthBearer();
            loading = false;
          });
      })
      .catch(() => {
        loading = false;
      });
  }

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
    setAuthBearer();
    delete localStorage['sentToServer'];
    //window.location.href = '/';
    meStore.reset();
    me = null;
  }

  let disabled = true;
  function loadAuth2() {
    disabled = false;
    initGoogleLogin();
  }
  async function onLogin(ev: { detail: any }) {
    me = new WasabeeMe(ev.detail);
    me.store();
    $meStore = me;
    setConfig(await loadConfig());
    opsStore.updateFromMe(me);
    await teamsStore.updateFromMe(me);
    sendTokenToServer();
  }

  async function serverChangeEvent(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    // virtual ligout
    clearOpsStorage();
    WasabeeMe.purge();

    try {
      // switch server
      setServer(value);
      setConfig(await loadConfig());

      // virtual login
      me = await meStore.refresh();
    } catch {
      // clear auth on failure
      meStore.reset();
      me = null;
      setAuthBearer();
      delete localStorage['sentToServer'];
      return;
    }
    me.store();

    if (!($location in routes)) replace('/teams');

    opsStore.updateFromMe(me);
    await teamsStore.updateFromMe(me);

    // firebase
    sendTokenToServer();
  }
</script>

<svelte:head>
  <script
    src="https://accounts.google.com/gsi/client"
    async
    defer
    on:load={loadAuth2}></script>
</svelte:head>

{#if !$meStore}
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
      <Input
        type="select"
        name="select"
        value={getServer()}
        on:change={serverChangeEvent}
      >
        {#each getServers() as server}
          <option value={server.url}>
            {server.name}
          </option>
        {/each}
      </Input>
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
    <p class="text-muted text-right small">Build date: __buildDate__</p>
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

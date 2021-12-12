<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { login } from '../auth';
  import { Nav, NavLink } from 'sveltestrap';

  export let disabled: boolean;
  let connecting: string = null;
  let selectAccount = false;

  const dispatch = createEventDispatcher();

  const servers = [
    {
      name: 'Americas Server',
      url: 'https://am.wasabee.rocks',
    },
    {
      name: 'EU Server',
      url: 'https://eu.wasabee.rocks',
    },
    {
      name: 'Asia/Pacific Server',
      url: 'https://ap.wasabee.rocks',
    },
  ];

  const urlParams = new URLSearchParams(window.location.search);
  const urlServer = urlParams.get('server');

  if (urlServer)
    servers.push({
      name: 'Custom: ' + urlServer,
      url: urlServer,
    });

  const disabledServer: { [url: string]: true } = {};

  async function loginTo(url: string) {
    if (disabled) return;
    connecting = url;
    try {
      const me: any = await login(url, selectAccount);
      if (me) dispatch('login', me);
    } catch (e) {
      console.error('unable to send token to ', url);
      disabledServer[url] = true;
    }
    connecting = null;
  }
</script>

<svelte:head>
  <link href="https://cdn2.wasabee.rocks/css/homepage.css" rel="stylesheet" />
</svelte:head>

<header class="masthead mx-auto mb-auto">
  <Nav class="nav-masthead" justified
    ><NavLink href="https://github.com/wasabee-project/Wasabee-IITC"
      >Github</NavLink
    ><NavLink href="https://enl.rocks/-dEHQ">Telegram</NavLink><NavLink
      href="https://www.youtube.com/playlist?list=PLyku9nmtwrADKQM9_EZk7NYbZXVOrBhXa"
      >Youtube</NavLink
    >
    <NavLink class="nav-brand" />
  </Nav>
</header>

<main role="main" class="cover-container text-center mx-auto">
  <h1 class="display-2 font-weight-bold">Wasabee</h1>
  <p class="h2">ENL Op Tools</p>
  <hr />
  <p class="lead">
    <a
      href="https://cdn2.wasabee.rocks/iitcplugin/prod/wasabee.user.js"
      class="btn btn-lg btn-success">Download the stable release</a
    >
  </p>
  <div class="lead serverlist">
    {#each servers as server}
      <button
        on:click={() => loginTo(server.url)}
        class={'btn btn-block ' +
          (disabledServer[server.url] ? 'btn-danger' : 'btn-success')}
      >
        Login to {server.name}{#if connecting == server.url}<span
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          />{/if}
      </button>
    {/each}
  </div>
  <label class="form-check-inline"
    ><input
      class="form-check-input"
      bind:checked={selectAccount}
      type="checkbox"
    />Select google account</label
  >
  <p class="small tips">
    Each server is a data-island, they do not share op/team info. If you do not
    see teams/operations you expect, please verify with your operator which
    server is being used.
  </p>
</main>

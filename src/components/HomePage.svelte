<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import { login } from '../auth';
  import { Button, Nav, NavLink, Spinner } from '@sveltestrap/sveltestrap';
  import { getServers } from '../config';
  import { FlatToast, ToastContainer } from 'svelte-toasts';
  import { notifyError } from '../notify';

  export let disabled: boolean;
  let connecting: string | null = null;
  let selectAccount = false;

  const dispatch = createEventDispatcher();

  const servers = getServers();

  const disabledServer: { [url: string]: true } = {};

  async function loginTo(url: string) {
    if (disabled) return;
    connecting = url;
    try {
      const me: any = await login(url, selectAccount);
      if (me) dispatch('login', me);
    } catch (e: any) {
      console.error('unable to send token to ', url, e.message);
      notifyError(`${e.reason}: ${e.message}`);
      if (e.cause === 'wasabee') {
        disabledServer[url] = true;
      }
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

<main class="cover-container text-center mx-auto">
  <ToastContainer let:data>
    <FlatToast {data} />
  </ToastContainer>
  <h1 class="display-2 font-weight-bold">Wasabee</h1>
  <p class="h2">ENL Op Tools</p>
  <hr />
  <p class="lead">
    <a
      href="https://cdn2.wasabee.rocks/iitcplugin/prod/wasabee.user.js"
      class="btn btn-lg btn-success">Download the stable release</a
    >
  </p>
  <p class="lead">
    <a href="https://app.wasabee.rocks" class="btn btn-lg btn-success"
      >Get ground Agents app</a
    >
  </p>
  <div class="lead serverlist">
    {#each servers as server}
      <div>
        <Button
          block
          color={disabledServer[server.url] ? 'danger' : 'success'}
          on:click={() => loginTo(server.url)}
        >
          Login to {server.name}
          {#if connecting == server.url}<Spinner size="sm" />{/if}
        </Button>
      </div>
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

<style>
  .serverlist > div {
    margin: 0.4rem;
  }
</style>

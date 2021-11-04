<script lang="ts">
  import { SendAccessTokenAsync } from '../server';
  import { createEventDispatcher } from 'svelte';

  import { getServer, setServer } from '../config';

  let disabled = true;

  const dispatch = createEventDispatcher();

  let server = getServer();

  function loadAuth2() {
    window.gapi.load('auth2', () => {
      window.gapi.auth2.enableDebugLogs(false);
      disabled = false;
    });
  }
  async function auth() {
    const options = {
      client_id:
        '269534461245-rpgijdorh2v0tdalis1s95fkebok73cl.apps.googleusercontent.com',
      scope: 'email profile openid',
      response_type: 'id_token permission',
      prompt: 'select_account',
    };
    window.gapi.auth2.authorize(options, (response) => {
      if (response.error) {
        const err = `error: ${response.error}: ${response.error_subtype}`;
        alert(err);
        console.log(err);
        return;
      }
      const oldserver = getServer();
      setServer(server);
      SendAccessTokenAsync(response.access_token)
        .then((me) => dispatch('login', me))
        .catch(() => {
          setServer(oldserver);
          server = oldserver;
        });
    });
  }
</script>

<svelte:head>
  <script
    src="https://apis.google.com/js/api.js"
    async
    defer
    on:load={loadAuth2}></script>
</svelte:head>

<input type="text" bind:value={server} />
<button class="btn btn-primary" on:click={auth} {disabled}>Login</button>

<script lang="ts">
  import { SendAccessTokenAsync } from '../server';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  function auth() {
    const options = {
      client_id:
        '269534461245-rpgijdorh2v0tdalis1s95fkebok73cl.apps.googleusercontent.com',
      scope: 'email profile openid',
      response_type: 'id_token permission',
      prompt: 'select_account',
    };
    window.gapi.load('auth2', () => {
      window.gapi.auth2.enableDebugLogs(false);
      window.gapi.auth2.authorize(options, (response) => {
        if (response.error) {
          const err = `error: ${response.error}: ${response.error_subtype}`;
          alert(err);
          console.log(err);
          return;
        }
        SendAccessTokenAsync(response.access_token).then((me) =>
          dispatch('login', me)
        );
      });
    });
  }
</script>

<svelte:head>
  <script
    src="https://apis.google.com/js/api.js"
    async
    defer
    on:load={auth}></script>
</svelte:head>

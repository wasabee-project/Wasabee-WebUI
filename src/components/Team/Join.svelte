<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { replace } from 'svelte-spa-router';

  import { notifyInfo, notifyOnError } from '../../notify';
  import { joinTeamPromise } from '../../server';

  export let params: any = {};
  export let teamid: TeamID;

  let token = params.token;

  const dispatch = createEventDispatcher();

  function refresh(force = true) {
    dispatch('routeEvent', { refresh: force });
  }

  if (token) {
    notifyOnError(joinTeamPromise(teamid, token)).then(() => {
      refresh();
      replace(`/team/${teamid}/list`);
      notifyInfo('Welcome aboard');
    });
  }
</script>

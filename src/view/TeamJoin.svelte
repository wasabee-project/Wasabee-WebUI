<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { replace } from 'svelte-spa-router';

  import { notifyOnError } from '../notify';
  import { joinTeamPromise } from '../server';

  export let params: any = {};
  export let teamid: TeamID;

  let token = params.token;

  const dispatch = createEventDispatcher();

  if (token) {
    notifyOnError(joinTeamPromise(teamid, token)).then(() => {
      dispatch('refresh');
      replace(`/team/${teamid}/list`);
    });
  }
</script>

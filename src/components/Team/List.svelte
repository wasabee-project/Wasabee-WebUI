<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { WasabeeTeam } from '../../model/';
  import Agent from '../Agent.svelte';

  export let teamStore: Writable<WasabeeTeam>;
  let team: WasabeeTeam = null;
  $: team = $teamStore;

  let checkmark = 'https://cdn2.wasabee.rocks/img/checkmark.png';

  $: agents = !team ? [] : team.agents;
</script>

{#if team}
  <h1 id="teamName">{team.name}</h1>
  <table class="table table-striped">
    <thead>
      <tr>
        <th scope="col">&nbsp;</th>
        <th scope="col">Agent</th>
        <th scope="col">Identity</th>
        <th scope="col">Sharing Location</th>
        <th scope="col">Sharing WD Keys</th>
        <th scope="col">Comment</th>
      </tr>
    </thead>
    <tbody id="teamTable">
      {#each agents as agent (agent.id)}
        <tr>
          <td><img src={agent.pic} height="50" width="50" alt="agent pic" /></td
          >
          <td><Agent {agent} /></td>
          <td>
            {[
              [agent.Vverified, 'V'],
              [agent.rocks, 'Rocks'],
              [agent.communityname, 'Community'],
              [agent.intelname, 'Intel'],
            ]
              .filter((a) => a[0])
              .map((a) => a[1])
              .join(' ')}
          </td>
          <td>
            {#if agent.shareLocation}
              <img src={checkmark} alt="sharing location" />
            {/if}
          </td>
          <td>
            {#if agent.shareWDKeys}
              <img src={checkmark} alt="sharing wd keys" />
            {/if}
          </td>
          <td>{agent.comment || ''}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

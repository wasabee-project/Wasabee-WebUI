<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { WasabeeTeam } from '../model/';

  export let teamStore: Writable<WasabeeTeam>;
  let team: WasabeeTeam = null;
  $: team = $teamStore;

  let checkmark = 'https://cdn2.wasabee.rocks/img/checkmark.png';

  $: agents = !team
    ? []
    : team.agents.map((agent) => ({
        id: agent.id,
        pic: agent.pic,
        name:
          !agent.rocks && !agent.Vverified && agent.intelname
            ? agent.intelname
            : agent.name,
        shareLoc: agent.state,
        shareWD: agent.ShareWD,
        squad: agent.squad,
      }));
</script>

{#if team}
  <h1 id="teamName">{team.name}</h1>
  <table class="table table-striped">
    <thead>
      <tr>
        <th scope="col">&nbsp;</th>
        <th scope="col">Agent</th>
        <th scope="col">Sharing Location</th>
        <th scope="col">Sharing WD Keys</th>
        <th scope="col">Squad</th>
      </tr>
    </thead>
    <tbody id="teamTable">
      {#each agents as agent (agent.id)}
        <tr>
          <td><img src={agent.pic} height="50" width="50" alt="agent pic" /></td
          >
          <td>{agent.name}</td>
          <td>
            {#if agent.shareLoc}
              <img src={checkmark} alt="sharing location" />
            {/if}
          </td>
          <td>
            {#if agent.shareWD}
              <img src={checkmark} alt="sharing wd keys" />
            {/if}
          </td>
          <td>{agent.squad}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  import type { WasabeeAgent, WasabeeTeam } from '../model/';
  import { WasabeeMe } from '../model';

  import {
    addAgentToTeamPromise,
    removeAgentFromTeamPromise,
    setAgentTeamSquadPromise,
  } from '../server';

  const dispatch = createEventDispatcher();

  export let teamStore: Writable<WasabeeTeam>;
  let team: WasabeeTeam = null;
  $: team = $teamStore;

  let me = WasabeeMe.get();

  let checkmark = 'https://cdn2.wasabee.rocks/img/checkmark.png';

  function refresh(force = true) {
    dispatch('routeEvent', { refresh: force });
  }

  let agentName = '';

  function addAgent() {
    addAgentToTeamPromise(agentName, team.id).then(
      () => {
        refresh();
      },
      (reject) => {
        console.log(reject);
      }
    );
  }
  function removeAgent(agent: WasabeeAgent) {
    removeAgentFromTeamPromise(agent.id, team.id).then(
      () => {
        refresh();
      },
      (reject) => {
        console.log(reject);
      }
    );
  }
  function agentSquadChange(agent: WasabeeAgent) {
    setAgentTeamSquadPromise(agent.id, team.id, agent.comment).then(
      () => {},
      (reject) => {
        console.log(reject);
      }
    );
  }
</script>

{#if team}
  <h1 id="teamName">{team.name}</h1>
  <label
    >Add Agent:
    <input
      type="text"
      placeholder="GoogleID or Agent Name"
      bind:value={agentName}
    />
  </label>
  <button on:click={addAgent}>Add</button>
  <table class="table table-striped">
    <thead>
      <tr>
        <th scope="col">&nbsp;</th>
        <th scope="col">Agent</th>
        <th scope="col">Identity</th>
        <th scope="col">Sharing Location</th>
        <th scope="col">Comment</th>
        {#if !team.rc}<th scope="col">&nbsp;</th>{/if}
      </tr>
    </thead>
    <tbody id="teamTable">
      {#each team.agents as agent (agent.id)}
        <tr>
          <td><img src={agent.pic} height="50" width="50" alt="agent pic" /></td
          >
          <td>{agent.name}</td>
          <td>
            {[
              [agent.Vverified, 'V'],
              [agent.rocks, 'Rocks'],
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
            <input
              bind:value={agent.comment}
              on:change={() => agentSquadChange(agent)}
            />
          </td>
          {#if !team.rc}
            <td>
              {#if agent.id != me.id}
                <button
                  on:click={() => removeAgent(agent)}
                  class="btn btn-danger btn-sm"
                >
                  Remove
                </button>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

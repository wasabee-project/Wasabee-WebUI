<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  import { WasabeeAgent, WasabeeMe } from '../../model';

  import { dKeyPromise } from '../../server';
  import { Input } from '@sveltestrap/sveltestrap';

  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch('routeEvent', { refresh: true });
  }

  export let dKeysStore: Writable<WDKey[]>;
  let dKeys: WDKey[] = [];
  $: dKeys = $dKeysStore;

  let me = WasabeeMe.get() as WasabeeMe;

  let sortBy: keyof WDKey = 'Name';
  let sortDesc = false;

  let sortedKeys: WDKey[] = [];
  $: {
    const keys = Array.from(dKeys);
    switch (sortBy) {
      case 'Name':
      case 'CapID':
        keys.sort((a, b) =>
          a[sortBy as 'Name' | 'CapID'].localeCompare(
            b[sortBy as 'Name' | 'CapID'],
          ),
        );
        break;
      case 'GID':
        keys.sort((a, b) =>
          getAgentName(a['GID']).localeCompare(getAgentName(b['GID'])),
        );
        break;
      case 'Count':
        keys.sort((a, b) => a['Count'] - b['Count']);
        break;
      default:
        break;
    }
    if (sortDesc) keys.reverse();
    sortedKeys = keys;
  }

  function sort(cat: keyof WDKey) {
    if (cat) {
      if (cat === sortBy) sortDesc = !sortDesc;
      else {
        sortBy = cat;
        sortDesc = false;
      }
    }
  }
  async function keyChange(key: WDKey) {
    try {
      await dKeyPromise(JSON.stringify(key));
      if (key.Count < 1) {
        refresh();
      }
    } catch (e) {
      console.log(e);
    }
  }
  function getAgentName(id: GoogleID) {
    const cachedAgent = WasabeeAgent.get(id);
    if (cachedAgent) return cachedAgent.name;
    return id;
  }
</script>

<div class="row">
  <table class="table table-striped">
    <thead>
      <tr>
        <th on:click={() => sort('Name')}>Portal</th>
        <th on:click={() => sort('GID')}>Agent</th>
        <th on:click={() => sort('Count')}>Agent Count</th>
        <th on:click={() => sort('CapID')}>Capsule</th>
      </tr>
    </thead>
    <tbody>
      {#each sortedKeys as key (key.PortalID + key.GID)}
        <tr>
          <td>{key.Name}</td>
          <td>{getAgentName(key.GID)}</td>
          <td>
            <Input
              size={3}
              type="number"
              on:change={() => keyChange(key)}
              bind:value={key.Count}
              disabled={key.GID != me.id}
            />
          </td>
          <td>
            <Input
              size={10}
              on:change={() => keyChange(key)}
              bind:value={key.CapID}
              disabled={key.GID != me.id}
            />
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

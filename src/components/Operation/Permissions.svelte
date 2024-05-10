<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  import type { WasabeeOp } from '../../model';
  import type { OpPermItem } from '../../model/operation';

  import WasabeeMe from '../../model/me';
  import { addPermPromise, delPermPromise } from '../../server';
  import { notifyOnError } from '../../notify';
  import {
    Button,
    Input,
    InputGroup,
    InputGroupText,
  } from '@sveltestrap/sveltestrap';

  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch('routeEvent', { refresh: true });
  }

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp;
  $: operation = $opStore;

  const me = WasabeeMe.get() as WasabeeMe;

  let teamID: TeamID;
  let teamRole: 'read' | 'write' | 'assignonly';
  let teamZone = 0;

  $: isOwner = me.id == operation.creator;

  type PermItem = {
    key: string;
    id: TeamID;
    name: string;
    role: 'read' | 'write' | 'assignonly';
    zone: number;
    zoneName: string;
  };

  $: teams = operation.teamlist.map((t: OpPermItem) => {
    const team = me.getTeam(t.teamid);
    const name = team ? team.Name : t.teamid;

    return {
      key: t.teamid + '/' + t.role + '/' + t.zone,
      id: t.teamid,
      name: name,
      role: t.role,
      zone: t.zone,
      zoneName: getZoneName(t.zone),
    };
  }) as PermItem[];

  function getZoneName(id: number) {
    for (const z of operation.zones) {
      if (z.id == id) return z.name;
    }
    return '*';
  }
  async function removePerm(t: PermItem) {
    try {
      await notifyOnError(delPermPromise(operation.ID, t.id, t.role, t.zone));
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function addPerm() {
    if (!teamID || !teamRole) return;

    // avoid duplicate
    for (const t of operation.teamlist) {
      if (t.teamid == teamID && t.role == teamRole && t.zone == teamZone) {
        return;
      }
    }

    try {
      await notifyOnError(
        addPermPromise(operation.ID, teamID, teamRole, teamZone),
      );
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
</script>

<h1 id="opName">{operation.name}</h1>
<table class="table table-striped">
  <thead>
    <tr>
      <th>Team</th>
      <th>Permission</th>
      <th>Zone</th>
      {#if isOwner}
        <th>&nbsp;</th>
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each teams as t}
      <tr>
        <td>{t.name}</td>
        <td>{t.role}</td>
        <td>{t.zoneName}</td>
        {#if isOwner}
          <td>
            <Button color="secondary" size="sm" on:click={() => removePerm(t)}
              >Remove</Button
            >
          </td>
        {/if}
      </tr>
    {/each}
  </tbody>
</table>
{#if isOwner}
  <div>
    <InputGroup>
      <InputGroupText>Add Team:</InputGroupText>
      <Input type="select" bind:value={teamID}>
        <option disabled>Team name:</option>
        {#each me.Teams as t (t.ID)}
          <option value={t.ID}>
            {t.Name}
          </option>
        {/each}
      </Input>
      <Input type="select" bind:value={teamRole}>
        <option disabled>Role:</option>
        <option value="read">Read</option>
        <option value="write">Write</option>
        <option value="assignedonly">Assigned only</option>
      </Input>
      <Input type="select" bind:value={teamZone}>
        <option value="0">All zones</option>
        {#each operation.zones as z (z.id)}
          <option value={z.id}>
            {z.name}
          </option>
        {/each}
      </Input>
      <Button color="info" on:click={addPerm}>Add</Button>
    </InputGroup>
  </div>
{/if}

<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  import type { WasabeeOp } from '../model';
  import {
    WasabeeTeam,
    WasabeeAgent,
    WasabeeMarker,
    WasabeeLink,
  } from '../model';

  import PortalLink from './PortalLink.svelte';

  import {
    assignLinkPromise,
    assignMarkerPromise,
    setLinkComment,
    setMarkerComment,
    setLinkZone,
    setMarkerZone,
    setAssignmentStatus,
    reverseLinkDirection,
  } from '../server';

  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch('routeEvent', { refresh: true });
  }

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp = null;
  $: operation = $opStore;

  let agents: WasabeeAgent[] = [];
  $: {
    const teamset = new Set(operation.teamlist.map((t) => t.teamid));
    const agentset = new Set<GoogleID>();
    for (const t of teamset) {
      const team = WasabeeTeam.get(t);
      if (team == null) continue;
      for (const a of team.agents) {
        agentset.add(a.id);
      }
    }
    agents = [];
    for (const a of agentset) {
      agents.push(WasabeeAgent.get(a));
    }
    agents = agents;
  }

  let steps: Task[] = [];
  $: if (operation) {
    const ts: Task[] = (operation.markers as Task[]).concat(operation.links);
    ts.sort((a, b) => {
      return a.order - b.order;
    });
    steps = ts;
  }
  // function setSteps(value) {
  //   const order = value.map((step) => step.ID);
  //   const xhr = new XMLHttpRequest();
  //   xhr.open(
  //     "POST",
  //     `/api/v1/draw/${operation.ID}/order`
  //   );
  //   xhr.setRequestHeader(
  //     "Content-Type",
  //     "application/x-www-form-urlencoded"
  //   );
  //   xhr.onload = () => {
  //     if (xhr.status === 200) {
  //       refresh();
  //     } else {
  //       console.log(xhr.responseText);
  //     }
  //   };
  //   xhr.send(encodeURI("order=" + order));
  // }

  function fourthroot(a: number) {
    return Math.pow(Math.E, Math.log(a) / 4.0);
  }
  function calculateDistance(link: WasabeeLink) {
    const dist = Math.round(link.length(operation) / 10) / 100;

    let level = 1.0;
    if (dist > 0.016) {
      level = fourthroot(dist * 1000) / (2 * fourthroot(10));
    }
    if (level > 8) {
      level = 8;
    }
    level = Math.round(level * 10) / 10;

    return dist + 'km (L' + level + ')';
  }
  async function setComment(step: Task) {
    try {
      if (step instanceof WasabeeLink) {
        await setLinkComment(operation.ID, step.ID, step.comment);
      } else {
        await setMarkerComment(operation.ID, step.ID, step.comment);
      }
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function setAssign(step: Task) {
    try {
      if (step instanceof WasabeeLink) {
        await assignLinkPromise(operation.ID, step.ID, step.assignedTo);
      } else {
        await assignMarkerPromise(operation.ID, step.ID, step.assignedTo);
      }
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function setZone(step: Task) {
    try {
      if (step instanceof WasabeeLink) {
        await setLinkZone(operation.ID, step.ID, step.zone);
      } else {
        await setMarkerZone(operation.ID, step.ID, step.zone);
      }
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function reverseLink(link: WasabeeLink) {
    try {
      await reverseLinkDirection(operation.ID, link.ID);
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  function complete(step: Task) {
    setAssignmentStatus(operation, step, step.completed).then(
      () => {
        operation.store();
      },
      (reject) => {
        console.log(reject);
      }
    );
  }
</script>

<!-- eslint-disable vue/no-mutating-props -->
<div class="card mb-2">
  <div class="card-header" id="opName">{operation.name}</div>
  <div class="card-body">
    <ul class="list-group list-group-flush">
      <textarea bind:value={operation.comment} class="form-control" />
    </ul>
  </div>
</div>

<table class="table table-striped" id="optable">
  <thead>
    <tr>
      <th scope="col">&nbsp;</th>
      <th scope="col">Order</th>
      <th scope="col">Portal</th>
      <th scope="col">&nbsp;</th>
      <th scope="col">To/Action</th>
      <th scope="col">Distance</th>
      <th scope="col">Zone</th>
      <th scope="col">Assigned To</th>
      <th scope="col">Description</th>
      <th scope="col">Completed</th>
    </tr>
  </thead>
  <tbody id="opSteps">
    {#each steps as step (step.ID)}
      <tr>
        <td class="handle" />

        <td>{step.order}</td>
        {#if step instanceof WasabeeMarker}
          <td>
            <PortalLink portalId={step.portalId} {operation} />
          </td>
          <td />
          <td class={step.type}>
            {step.friendlyType}
          </td>
          <td />
        {:else if step instanceof WasabeeLink}
          <td>
            <PortalLink portalId={step.fromPortalId} {operation} />
          </td>
          <td>
            <img
              on:click={() => reverseLink(step)}
              src="https://cdn2.wasabee.rocks/img/swap.svg"
              height="16"
              alt="swap"
            />
          </td>
          <td>
            <PortalLink portalId={step.toPortalId} {operation} />
          </td>
          <td>
            {calculateDistance(step)}
          </td>
        {/if}
        <td>
          <select bind:value={step.zone} on:change={() => setZone(step)}>
            <option value="0">All zones</option>
            {#each operation.zones as z (z.id)}
              <option value={z.id}>
                {z.name}
              </option>
            {/each}
          </select>
        </td>
        <td>
          <select
            bind:value={step.assignedTo}
            on:change={() => setAssign(step)}
          >
            <option value="">Unassigned</option>
            {#each agents as a (a.id)}
              <option value={a.id}>
                {a.name}
              </option>
            {/each}
          </select>
        </td>
        <td>
          <input bind:value={step.comment} on:change={() => setComment(step)} />
        </td>
        <td class="text-center">
          <input
            type="checkbox"
            bind:checked={step.completed}
            on:change={() => complete(step)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</table>

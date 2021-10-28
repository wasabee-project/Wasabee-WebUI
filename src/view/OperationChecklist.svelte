<script lang="ts">
  import type { Writable } from 'svelte/store';

  import PortalLink from './PortalLink.svelte';

  import {
    WasabeeAgent,
    WasabeeOp,
    WasabeeMe,
    WasabeeMarker,
    WasabeeLink,
  } from '../model';

  import { SetMarkerState, setAssignmentStatus } from '../server';

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp = null;
  $: operation = $opStore;

  export let assignmentsOnly: boolean = false;

  const me = WasabeeMe.get();

  let steps: Task[] = [];

  $: if (operation) {
    const ts: Task[] = (operation.markers as Task[]).concat(operation.links);
    ts.sort((a, b) => {
      return a.order - b.order;
    });
    if (assignmentsOnly) steps = ts.filter((s) => s.assignedTo == me.id);
    else steps = ts;
  }

  function fourthroot(a: number) {
    return Math.pow(Math.E, Math.log(a) / 4.0);
  }

  function getAgentName(id: GoogleID) {
    if (!id) return '';
    const agent = WasabeeAgent.get(id);
    if (agent) return agent.name;
    return id;
  }

  function needAck(step: Task) {
    if (step instanceof WasabeeMarker) {
      return (
        !(step.state == 'acknowledged' || step.state == 'completed') &&
        step.assignedTo == me.id
      );
    }
    return false;
  }
  async function ackMarker(id: string) {
    try {
      console.log('setting marker acknowledge');
      await SetMarkerState(operation.ID, id, 'acknowledged');
      operation.store();
    } catch (e) {
      console.log(e);
    }
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
  function getZoneName(id: number) {
    for (const z of operation.zones) {
      if (z.id == id) return z.name;
    }
    return '*';
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

<div class="card mb-2">
  <div class="card-header" id="opName">{operation.name}</div>
  <div class="card-body">
    <ul class="list-group list-group-flush">
      <li class="list-group-item" id="opComment">
        Comment: {operation.comment}
      </li>
      <!-- <li class="list-group-item"><a :href="'/api/v1/draw/' + operation.ID + '/stock'">Stock Intel Link</a></li> -->
      {#if assignmentsOnly}
        <li class="list-group-item">
          <strong
            ><a href={'/api/v1/draw/' + operation.ID + '/myroute'}
              >My Route (assignments in order)</a
            >
            (Google Maps)</strong
          >
        </li>
      {/if}
    </ul>
  </div>
</div>

<table class="table table-striped" id="optable">
  <thead>
    <tr>
      <th scope="col">Order</th>
      <th scope="col">Portal</th>
      <th scope="col">To/Action</th>
      <th scope="col">Distance</th>
      <th scope="col">Assigned To</th>
      <th scope="col">Description</th>
      <th scope="col">Zone</th>
      <th scope="col">Completed</th>
    </tr>
  </thead>
  <tbody id="opSteps">
    {#each steps as step (step.ID)}
      <tr>
        <td>{step.order}</td>

        {#if step instanceof WasabeeMarker}
          <td>
            <PortalLink portalId={step.portalId} {operation} />
          </td>
          <td class={step.type}>
            {step.friendlyType}
          </td>
          <td />
        {:else if step instanceof WasabeeLink}
          <td>
            <PortalLink portalId={step.fromPortalId} {operation} />
          </td>
          <td>
            <PortalLink portalId={step.toPortalId} {operation} />
          </td>
          <td>
            {calculateDistance(step)}
          </td>
        {/if}
        <td>
          {getAgentName(step.assignedTo)}
          {#if needAck(step)}
            <button
              on:click={() => ackMarker(step.ID)}
              class="btn btn-warning btn-sm"
            >
              ack
            </button>
          {/if}
        </td>
        <td>{step.comment}</td>
        <td>{getZoneName(step.zone)}</td>
        <td class="text-center">
          <input
            type="checkbox"
            bind:checked={step.completed}
            disabled={step.assignedTo != me.id}
            on:change={() => complete(step)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</table>
<div id="opTable" />

<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';
  import { dndzone, type Item } from 'svelte-dnd-action';

  import type { WasabeeOp } from '../../model';
  import {
    WasabeeTeam,
    WasabeeAgent,
    WasabeeMarker,
    WasabeeLink,
    Task,
  } from '../../model';

  import PortalLink from './PortalLink.svelte';

  import {
    reverseLinkDirection,
    updateOpPromise,
    taskCompletePromise,
    taskAssignPromise,
    taskDeleteAssignPromise,
    taskCommentPromise,
    taskZonePromise,
  } from '../../server';
  import { notifyOnError } from '../../notify';
  import { Button, FormCheck, Input } from '@sveltestrap/sveltestrap';

  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch('routeEvent', { refresh: true });
  }

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp;
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
      agents.push(WasabeeAgent.get(a)!);
    }
    agents = agents;
  }

  let steps: { id: TaskID; task: Task }[] = [];
  $: if (operation) {
    const ts: Task[] = (operation.markers as Task[]).concat(operation.links);
    ts.sort((a, b) => {
      return a.order - b.order;
    });
    steps = ts.map((t) => ({ id: t.ID, task: t }));
  }

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
      await taskCommentPromise(operation.ID, step.ID, step.comment);
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function setAssign(step: Task) {
    try {
      if (step.assignedTo)
        await taskAssignPromise(operation.ID, step.ID, [step.assignedTo]);
      else await taskDeleteAssignPromise(operation.ID, step.ID);
      // if (step.state === 'pending')
      //   await taskCompletePromise(operation.ID, step.ID, false);
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function setZone(step: Task) {
    try {
      await taskZonePromise(operation.ID, step.ID, step.zone);
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
    taskCompletePromise(operation.ID, step.ID, step.completed).then(
      () => {
        operation.store();
      },
      (reject) => {
        console.log(reject);
      },
    );
  }

  let toggleDrag = false;
  let dragDisabled = true;

  const flipDurationMs = 300;
  function handleDndConsider(e: CustomEvent<DndEvent>) {
    steps = e.detail.items as Item['items'];
  }
  function handleDndFinalize(e: CustomEvent<DndEvent>) {
    if (steps.length < 2) return;
    const id = e.detail.info.id;
    steps = e.detail.items as Item['items'];
    const to = steps.findIndex((s) => s.id === id);
    if (to === 0) steps[to].task.order = steps[1].task.order - 1;
    else if (to === steps.length - 1)
      steps[to].task.order = steps[to - 1].task.order + 1;
    else if (steps[to + 1].task.order - steps[to - 1].task.order >= 2)
      steps[to].task.order = steps[to - 1].task.order + 1;
    else {
      steps[to].task.order = steps[to - 1].task.order + 1;
      while (steps[to + 1].task.order <= steps[to].task.order) {
        for (let i = to + 1; i < steps.length; i++) {
          if (steps[i].task.order <= steps[i - 1].task.order)
            steps[i].task.order++;
        }
      }
    }
    notifyOnError(updateOpPromise(operation));
    dragDisabled = true;
  }
  // https://svelte.dev/repl/4949485c5a8f46e7bdbeb73ed565a9c7?version=3.24.1
  function startDrag(e: Event) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }

  function incrOrder() {
    shiftOrder(1);
    notifyOnError(updateOpPromise(operation));
  }
  function decrOrder() {
    shiftOrder(-1);
    notifyOnError(updateOpPromise(operation));
  }
  function shiftOrder(v: number) {
    for (const s of steps) {
      s.task.order += v;
    }
    steps = steps;
  }
</script>

<!-- eslint-disable vue/no-mutating-props -->
<div class="card mb-2">
  <div class="card-header" id="opName">{operation.name}</div>
  <div class="card-body">
    <ul class="list-group list-group-flush">
      <Input type="textarea" bind:value={operation.comment} />
    </ul>
    <Button on:click={incrOrder} class="btn btn-success">Order +1</Button>
    <Button on:click={decrOrder} class="btn btn-danger">Order -1</Button>
  </div>
</div>

<table class="table table-striped" id="optable">
  <thead>
    <tr>
      <th class="pl-0 pr-0" scope="col">
        <Input type="switch" bind:checked={toggleDrag} id="enableDrag" /></th
      >
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
  <tbody
    id="opSteps"
    use:dndzone={{ items: steps, dragDisabled: !toggleDrag || dragDisabled }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#each steps as step (step.id)}
      <tr animate:flip={{ duration: flipDurationMs }}>
        <td
          class:handle={toggleDrag}
          class:dark-filter-invert={true}
          on:mousedown={startDrag}
          on:touchstart={startDrag}
        />

        <td class="text-right">{step.task.order}</td>
        {#if step.task instanceof WasabeeMarker}
          <td>
            <PortalLink portalId={step.task.portalId} {operation} />
          </td>
          <td />
          <td class={step.task.type}>
            {step.task.friendlyType}
          </td>
          <td />
        {:else if step.task instanceof WasabeeLink}
          <td>
            <PortalLink portalId={step.task.fromPortalId} {operation} />
          </td>
          <td>
            <Button
              on:click={() => reverseLink(step.task)}
              size="sm"
              color="light"
            >
              <img
                src="https://cdn2.wasabee.rocks/img/swap.svg"
                height="16"
                alt="swap"
                class="dark-filter-invert"
              />
            </Button>
          </td>
          <td>
            <PortalLink portalId={step.task.toPortalId} {operation} />
          </td>
          <td>
            {calculateDistance(step.task)}
          </td>
        {/if}
        <td>
          <Input
            type="select"
            bind:value={step.task.zone}
            on:change={() => setZone(step.task)}
          >
            <option value="0">All zones</option>
            {#each operation.zones as z (z.id)}
              <option value={z.id}>
                {z.name}
              </option>
            {/each}
          </Input>
        </td>
        <td>
          <Input
            type="select"
            bind:value={step.task.assignedTo}
            on:change={() => setAssign(step.task)}
          >
            <option value="">Unassigned</option>
            {#each agents as a (a.id)}
              <option value={a.id} selected={a.id === step.task.assignedTo}>
                {a.name}
              </option>
            {/each}
          </Input>
        </td>
        <td>
          <Input
            bind:value={step.task.comment}
            on:change={() => setComment(step.task)}
          />
        </td>
        <td class="text-center">
          <Input
            type="checkbox"
            bind:checked={step.task.completed}
            on:change={() => complete(step.task)}
          />
        </td>
      </tr>
    {/each}
  </tbody>
</table>

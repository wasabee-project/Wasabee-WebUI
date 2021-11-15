<script lang="ts">
  import { flip } from 'svelte/animate';

  import type { Writable } from 'svelte/store';

  import PortalLink from './PortalLink.svelte';

  import { WasabeeOp, WasabeeMarker, WasabeeLink } from '../model';
  import { updateOpPromise } from '../server';

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp = null;
  $: operation = $opStore;

  let steps: Task[] = [];

  $: if (operation) {
    const ts: Task[] = (operation.markers as Task[]).concat(operation.links);
    ts.sort((a, b) => {
      return a.order - b.order;
    });
    steps = ts;
  }

  function getZoneName(id: number) {
    for (const z of operation.zones) {
      if (z.id == id) return z.name;
    }
    return '*';
  }

  let selectedTask: Task;

  function toggleDepend(id: TaskID) {
    if (!selectedTask) return;
    let depends = selectedTask.dependsOn;
    if (depends.includes(id)) depends = depends.filter((v) => v !== id);
    else depends.push(id);
    selectedTask.dependsOn = depends;
    dfs();
  }

  function dfs() {
    const tasks = new Map<TaskID, TaskID[]>();
    for (const m of operation.markers) tasks.set(m.ID, m.dependsOn);
    for (const l of operation.links) tasks.set(l.ID, l.dependsOn);

    const finishTime = new Map<TaskID, number>();
    let time = 0;

    function dfs_run(tasks: Map<TaskID, TaskID[]>, start: TaskID) {
      if (finishTime.has(start)) return;
      if (!tasks.has(start)) return;
      finishTime.set(start, time);
      for (const t of tasks.get(start)) dfs_run(tasks, t);
      finishTime.set(start, time);
      time += 1;
    }

    for (const t of tasks.keys()) {
      dfs_run(tasks, t);
    }

    const sortedTasks = Array.from(finishTime)
      .sort((a, b) => b[1] - a[1])
      .map((t) => t[0]);
    const revTasks = new Map<TaskID, TaskID[]>(sortedTasks.map((t) => [t, []]));
    for (const [t, ts] of tasks) {
      for (const td of ts) {
        if (revTasks.has(td)) revTasks.get(td).push(t);
      }
    }

    finishTime.clear();
    time = 0;
    for (const t of sortedTasks) {
      dfs_run(revTasks, t);
    }

    for (const m of operation.markers) {
      m.order = time - finishTime.get(m.ID);
    }
    for (const l of operation.links) {
      l.order = time - finishTime.get(l.ID);
    }
    operation.store();
    operation = operation;
  }
</script>

<div class="card mb-2">
  <div class="card-header" id="opName">{operation.name}</div>
  <button class="btn btn-primary" on:click={() => updateOpPromise(operation)}
    >Upload</button
  >
</div>

<div class="row">
  <div class="col-6">
    <table class="table table-striped" id="optable">
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col">Portal</th>
          <th scope="col">To/Action</th>
          <th scope="col">Zone</th>
        </tr>
      </thead>
      <tbody id="opSteps">
        {#each steps as step (step.ID)}
          <tr
            class:table-success={selectedTask && selectedTask.ID == step.ID}
            on:click={() => {
              selectedTask = step;
            }}
            animate:flip={{ duration: 1000 }}
          >
            <td>{step.order}</td>

            {#if step instanceof WasabeeMarker}
              <td>
                <PortalLink portalId={step.portalId} {operation} />
              </td>
              <td class={step.type}>
                {step.friendlyType}
              </td>
            {:else if step instanceof WasabeeLink}
              <td>
                <PortalLink portalId={step.fromPortalId} {operation} />
              </td>
              <td>
                <PortalLink portalId={step.toPortalId} {operation} />
              </td>
            {/if}
            <td>{getZoneName(step.zone)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="col-6">
    <table class="table table-striped" id="optable">
      <thead>
        <tr>
          <th scope="col">Order</th>
          <th scope="col">Portal</th>
          <th scope="col">To/Action</th>
          <th scope="col">Zone</th>
        </tr>
      </thead>
      <tbody id="opSteps">
        {#each steps as step (step.ID)}
          <tr
            class:table-success={selectedTask &&
              selectedTask.dependsOn.includes(step.ID)}
            class:table-danger={selectedTask &&
              step.dependsOn.includes(selectedTask.ID)}
            on:click={() => toggleDepend(step.ID)}
            animate:flip={{ duration: 1000 }}
          >
            <td>{step.order}</td>

            {#if step instanceof WasabeeMarker}
              <td>
                <PortalLink portalId={step.portalId} {operation} />
              </td>
              <td class={step.type}>
                {step.friendlyType}
              </td>
            {:else if step instanceof WasabeeLink}
              <td>
                <PortalLink portalId={step.fromPortalId} {operation} />
              </td>
              <td>
                <PortalLink portalId={step.toPortalId} {operation} />
              </td>
            {/if}
            <td>{getZoneName(step.zone)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

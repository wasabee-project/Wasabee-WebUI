<script lang="ts">
  import { flip } from 'svelte/animate';

  import type { Writable } from 'svelte/store';

  import PortalLink from './PortalLink.svelte';

  import { WasabeeOp, WasabeeMarker, WasabeeLink, Task } from '../model';
  import {
    addTaskDepend,
    deleteTaskDepend,
    updateOpPromise,
    opPromise,
  } from '../server';
  import { notifyOnError } from '../notify';

  export let opStore: Writable<WasabeeOp>;
  $: operation = $opStore;

  let selectedTask: Task;
  $: [order, graphStartTime, graphEndTime, strongComponents] =
    computeOrderAndComponents(operation);
  $: graphMax = Math.max(...graphEndTime.values());

  $: steps = sortSteps(operation, order);

  function sortSteps(operation: WasabeeOp, order: Map<TaskID, number>) {
    if (operation) {
      const ts: Task[] = (operation.markers as Task[]).concat(operation.links);
      ts.sort((a, b) => {
        return order.get(a.ID) - order.get(b.ID);
      });
      return ts;
    }
    return [];
  }

  function resetDepends() {
    for (const m of operation.markers) {
      m.dependsOn = [];
    }
    for (const l of operation.links) {
      l.dependsOn = [];
    }
    // store new depends
    operation.store();
    [order, graphStartTime, graphEndTime, strongComponents] =
      computeOrderAndComponents(operation);
  }

  function guessDepends() {
    const ts = (operation.markers as Task[]).concat(operation.links);
    // derive depends from order
    if (ts.every((t) => t.dependsOn.length == 0)) {
      ts.sort((a, b) => {
        return a.order - b.order;
      });
      for (let i = 0; i < ts.length - 1; i++) {
        let o = ts[i].order;
        let j = i + 1;
        for (; j < ts.length && ts[j].order == o; j++) {}
        if (j == ts.length) break;
        o = ts[j].order;
        for (; j < ts.length && ts[j].order == o; j++) {
          if (!ts[j].dependsOn.includes(ts[i].ID))
            ts[j].dependsOn.push(ts[i].ID);
        }
      }
    }
    operation.store();
    [order, graphStartTime, graphEndTime, strongComponents] =
      computeOrderAndComponents(operation);
  }

  function orderTaskBy(order: Map<TaskID, number>) {
    for (const m of operation.markers) {
      m.order = order.get(m.ID);
    }
    for (const l of operation.links) {
      l.order = order.get(l.ID);
    }
    operation.store();
    steps = steps;
  }

  function toggleDepend(id: TaskID) {
    if (!selectedTask) return;
    let depends = selectedTask.dependsOn;
    if (depends.includes(id)) {
      depends = depends.filter((v) => v !== id);
      notifyOnError(deleteTaskDepend(operation.ID, selectedTask, id));
    } else {
      depends.push(id);
      notifyOnError(addTaskDepend(operation.ID, selectedTask, id));
    }
    selectedTask.dependsOn = depends;

    // update graph/order
    [order, graphStartTime, graphEndTime, strongComponents] =
      computeOrderAndComponents(operation);
    // store new depends
    operation.store();
  }

  async function uploadOrderAnDepends() {
    const op = await opPromise(operation.ID);
    if (op !== operation) {
      const n = new Map<TaskID, Task>();
      for (const m of operation.markers) {
        n.set(m.ID, m);
      }
      for (const l of operation.links) {
        n.set(l.ID, l);
      }
      const p: Task[] = [];
      for (const m of op.markers) {
        p.push(m);
      }
      for (const l of op.links) {
        p.push(l);
      }
      for (const t of p) {
        const nt = n.get(t.ID);
        if (!nt) continue;
        t.order = nt.order;
        t.dependsOn = nt.dependsOn;
      }
    }
    await notifyOnError(updateOpPromise(op));
    op.store();
    $opStore = op;
  }

  function computeOrderAndComponents(operation: WasabeeOp) {
    const dfsTime = new Map<TaskID, number>();
    const startTime = new Map<TaskID, number>();
    const finishTime = new Map<TaskID, number>();
    const strongComponents = new Map<TaskID, TaskID[]>();
    if (operation && (operation.links.length || operation.markers.length)) {
      const tasks = new Map<TaskID, TaskID[]>();
      for (const m of operation.markers) tasks.set(m.ID, m.dependsOn);
      for (const l of operation.links) tasks.set(l.ID, l.dependsOn);

      let time = 0;

      function dfs_run(tasks: Map<TaskID, TaskID[]>, start: TaskID) {
        if (dfsTime.has(start)) return;
        if (!tasks.has(start)) return;
        dfsTime.set(start, time);
        for (const t of tasks.get(start)) dfs_run(tasks, t);
        dfsTime.set(start, time);
        time += 1;
      }

      for (const t of tasks.keys()) {
        dfs_run(tasks, t);
      }

      const sortedTasks = Array.from(dfsTime)
        .sort((a, b) => b[1] - a[1])
        .map((t) => t[0]);
      const revTasks = new Map<TaskID, TaskID[]>(
        sortedTasks.map((t) => [t, []])
      );
      for (const [t, ts] of tasks) {
        for (const td of ts) {
          if (revTasks.has(td)) revTasks.get(td).push(t);
        }
      }

      dfsTime.clear();

      time = 0;
      let ccTime = 0;
      const scc: TaskID[][] = [];
      for (const t of sortedTasks) {
        if (dfsTime.has(t)) continue;
        dfs_run(revTasks, t);
        const cc = Array.from(dfsTime)
          .filter((t) => t[1] >= ccTime)
          .map((t) => t[0]);
        for (const t of cc) {
          strongComponents.set(t, cc);
        }
        ccTime = time;
        scc.push(cc);
      }
      for (const [tid, t] of dfsTime) dfsTime.set(tid, time - t);

      // compute startTime
      let maxCcTime = 0;
      for (const cc of scc.reverse()) {
        let ccTime = 0;
        for (const t of cc) {
          for (const td of tasks.get(t)) {
            if (!cc.includes(td)) {
              const time = startTime.get(td);
              if (ccTime < time + 1) ccTime = time + 1;
            }
          }
        }
        for (const t of cc) {
          startTime.set(t, ccTime);
        }
        if (ccTime > maxCcTime) maxCcTime = ccTime;
      }

      // compute finishTime
      for (const cc of scc) {
        let ccTime = maxCcTime + 1;
        for (const t of cc) {
          for (const td of revTasks.get(t)) {
            if (!cc.includes(td)) {
              const time = startTime.get(td);
              if (ccTime > time) ccTime = time;
            }
          }
        }
        for (const t of cc) {
          finishTime.set(t, ccTime);
        }
      }
    }
    // order (no duplicate), earliest order, latest order, components
    return [dfsTime, startTime, finishTime, strongComponents] as const;
  }

  function getZoneName(id: number) {
    for (const z of operation.zones) {
      if (z.id == id) return z.name;
    }
    return '*';
  }

  function stepClasses(selectedTask: Task, step: Task) {
    if (!selectedTask) return 'table-dark';
    if (selectedTask.ID === step.ID) return 'table-warning';
    if (selectedTask.dependsOn.includes(step.ID)) return 'table-success';
    if (step.dependsOn.includes(selectedTask.ID)) return 'table-danger';
    if (strongComponents.get(selectedTask.ID).includes(step.ID))
      return 'table-warning';
    return 'table-dark';
  }

  let showGraph = false;
</script>

<div class="card mb-2">
  <div class="card-header" id="opName">
    {operation.name}
    <button class="btn btn-primary" on:click={() => (showGraph = !showGraph)}
      >Toggle diagram</button
    >
    <button class="btn btn-primary" on:click={() => resetDepends()}
      >Reset depends</button
    >
    <button class="btn btn-primary" on:click={() => guessDepends()}
      >Guess from order</button
    >
    <button class="btn btn-primary" on:click={() => orderTaskBy(order)}
      >Order strict</button
    >
    <button class="btn btn-primary" on:click={() => orderTaskBy(graphStartTime)}
      >Order by start</button
    >
    <button class="btn btn-primary" on:click={() => orderTaskBy(graphEndTime)}
      >Order by end</button
    >
    <button class="btn btn-primary" on:click={() => uploadOrderAnDepends()}
      >Upload order</button
    >
  </div>
</div>

<div class="row">
  <div class="col-6">
    <table class="table table-striped steps">
      <thead>
        <tr>
          <th scope="col" class="order">Order</th>
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
            <td class="order">{step.order}</td>

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
  {#if !showGraph}
    <div class="col-6">
      <table class="table table-striped steps">
        <thead>
          <tr>
            <th scope="col" class="order">Order</th>
            <th scope="col">Portal</th>
            <th scope="col">To/Action</th>
            <th scope="col">Zone</th>
          </tr>
        </thead>
        <tbody id="opSteps">
          {#each steps as step (step.ID)}
            <tr
              class:table-warning={selectedTask &&
                strongComponents.has(selectedTask.ID) &&
                strongComponents.get(selectedTask.ID).includes(step.ID)}
              class:table-success={selectedTask &&
                selectedTask.dependsOn.includes(step.ID)}
              class:table-danger={selectedTask &&
                step.dependsOn.includes(selectedTask.ID)}
              on:click={() => toggleDepend(step.ID)}
              animate:flip={{ duration: 1000 }}
            >
              <td class="order">{step.order}</td>

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
  {:else}
    <div class="col-6">
      <table class="table table-striped graph">
        <thead>
          <tr><th>Header</th></tr>
        </thead>
        <tbody style="--graph-size: {graphMax}">
          {#each steps as step (step.ID)}
            <tr
              on:click={() => toggleDepend(step.ID)}
              animate:flip={{ duration: 1000 }}
            >
              <td
                class={stepClasses(selectedTask, step)}
                style="margin-left: {(graphStartTime.get(step.ID) / graphMax) *
                  100}%; width: {((graphEndTime.get(step.ID) -
                  graphStartTime.get(step.ID)) /
                  graphMax) *
                  100}%">&nbsp;</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .graph td {
    display: block;
    border-radius: 1em;
    margin-top: 0.4em;
    margin-bottom: 0.4em;
    padding-top: 0;
    padding-bottom: 0;
    transition: width 0.5s, margin-left 0.5s;
  }

  .steps,
  .graph {
    table-layout: fixed;
  }

  .steps td {
    padding-top: 0.4em;
    padding-bottom: 0.4em;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .order {
    width: 3.5em;
  }
</style>

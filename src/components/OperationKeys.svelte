<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { createEventDispatcher } from 'svelte';

  import { Icon } from 'leaflet';
  import { LeafletMap, Marker, TileLayer } from 'svelte-leafletjs';

  import type { WasabeeOp } from '../model';
  //import type { KeyOnHand } from "../model/operation";

  import { WasabeeAgent, WasabeeMe, WasabeeTeam } from '../model';
  import { opKeyPromise } from '../server';
  import { notifyOnError } from '../notify';

  const dispatch = createEventDispatcher();
  function refresh() {
    dispatch('routeEvent', { refresh: true });
  }

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp = null;
  $: operation = $opStore;

  const me = WasabeeMe.get();

  let sortBy = 'name';
  let sortDesc = false;
  let agent = '';

  let agentList = [];

  $: {
    const map = new Map();
    for (const tr of operation.teamlist) {
      const team = WasabeeTeam.get(tr.teamid);
      if (!team) continue;
      for (const agent of team.agents) map.set(agent.id, agent);
    }
    if (!map.size) agentList = [{ id: me.id, name: me.name }];
    else agentList = Array.from(map.values());
  }

  $: keysZones = operation.keysRequiredPerPortalPerZone();

  type KoHItem = {
    id: PortalID;
    name: string;
    required: number;
    agentRequired: number;
    onHand: number;
    iHave: number;
    capsule: string;
  };
  let keylist: KoHItem[] = [];
  $: {
    const kmap = new Map();
    for (const a of operation.anchors) {
      const links = operation.links.filter(function (link) {
        return link.toPortalId == a;
      });

      const k = {
        id: a,
        name: operation.getPortal(a).name,
        required: links.length,
        agentRequired: links.filter((l) => l.assignedTo == agent).length,
        onHand: 0,
        iHave: 0,
        capsule: '',
      };
      if (k.required > 0) kmap.set(k.id, k);
    }

    for (const p of operation.markers.filter(
      (m) => m.type == 'GetKeyPortalMarker'
    )) {
      if (!kmap.has(p.portalId)) {
        const k = {
          id: p.portalId,
          name: operation.getPortal(p.portalId).name,
          required: 0,
          agentRequired: 0,
          onHand: 0,
          iHave: 0,
          capsule: '',
        };
        kmap.set(k.id, k);
      }
    }

    const klist = [];
    for (const [id, k] of kmap) {
      const thesekeys = operation.keysonhand.filter((kk) => kk.portalId == id);
      if (thesekeys && thesekeys.length > 0) {
        for (const t of thesekeys) {
          k.onHand += t.onhand;
          if (t.gid == agent) {
            k.iHave = t.onhand;
            k.capsule = t.capsule;
          }
        }
      }
      klist.push(k);
    }

    switch (sortBy) {
      case 'name':
      case 'capsule':
        klist.sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
        break;
      case 'required':
      case 'agentRequired':
      case 'onHand':
      case 'iHave':
        klist.sort((a, b) => a[sortBy] - b[sortBy]);
        break;
      default:
        break;
    }
    if (sortDesc) klist.reverse();

    keylist = klist;
  }

  $: koh = operation.keysonhand.map((k) => ({
    name: (
      operation.getPortal(k.portalId) || { name: '[portal no longer in op]' }
    ).name,
    key: k.portalId + k.gid + k.capsule,
    agent: getAgentName(k.gid),
    count: k.onhand,
    capsule: k.capsule,
  }));

  function sort(cat: string) {
    if (cat === sortBy) sortDesc = !sortDesc;
    else {
      sortBy = cat;
      sortDesc = false;
    }
  }
  async function keyChangeCount(key: KoHItem, target: EventTarget) {
    const input = <HTMLInputElement>target;
    try {
      await notifyOnError(
        opKeyPromise(operation.ID, key.id, +input.value, key.capsule)
      );
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  async function keyChangeCapsule(key: KoHItem, target: EventTarget) {
    const input = <HTMLInputElement>target;
    try {
      // delete old entry
      await notifyOnError(opKeyPromise(operation.ID, key.id, 0, key.capsule));
      await notifyOnError(
        opKeyPromise(operation.ID, key.id, key.iHave, input.value)
      );
      refresh();
    } catch (e) {
      console.log(e);
    }
  }
  function getAgentName(id: GoogleID) {
    const agent = WasabeeAgent.get(id);
    if (agent) return agent.name;
    return id;
  }

  let selectedKey: string = null;
  $: keyPortal = operation.getPortal(selectedKey);
  let keyTotalRequired: number;
  let keySummary: { [agentID: GoogleID]: { onHand: number; required: number } };
  $: {
    const keyRequired = operation.keysRequiredForPortalPerAgent(selectedKey);
    keyTotalRequired = Object.values(keyRequired).reduce((a, b) => a + b, 0);
    const keyOnHand = operation.keysOnHandForPortalPerAgent(selectedKey);
    keySummary = {};
    for (const id in keyOnHand) {
      keySummary[id] = { onHand: keyOnHand[id], required: 0 };
    }
    for (const id in keyRequired) {
      if (!(id in keySummary)) keySummary[id] = { onHand: 0, required: 0 };
      keySummary[id].required += keyRequired[id];
    }
  }

  let map: LeafletMap;
  $: {
    if (map && keyPortal) {
      const m = map.getMap();
      if (m) m.setView(keyPortal.latLng, 15);
    }
  }
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileLayerOptions = {
    minZoom: 0,
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: '© OpenStreetMap contributors',
  };
  const iconOpt: L.IconOptions = {
    iconSize: [24, 41] as L.PointTuple,
    iconAnchor: [12, 41] as L.PointTuple,
    popupAnchor: [-1, -48] as L.PointTuple,
    iconUrl:
      'https://cdn2.wasabee.rocks/img/markers/wasabee_markers_key_done.svg',
  };
</script>

<h1 id="opName">{operation.name}</h1>
<div class="row">
  <div class="col">
    <table class="table table-striped">
      <thead>
        <tr>
          <th on:click={() => sort('name')}>Portal</th>
          <th on:click={() => sort('required')}>Required</th>
          <th>
            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label on:click={() => sort('agentRequired')}>For</label>
            <select bind:value={agent}>
              {#each agentList as a (a.id)}
                <option value={a.id}>
                  {a.name}
                </option>
              {/each}
            </select>
          </th>
          <th on:click={() => sort('onHand')}>Total</th>
          <th on:click={() => sort('iHave')}>Agent Count</th>
          <th on:click={() => sort('capsule')}>Capsule</th>
        </tr>
      </thead>
      <tbody>
        {#each keylist as key (key.id)}
          <tr
            class:table-warning={key.agentRequired > key.iHave}
            class:table-danger={key.required > key.onHand}
            on:click={() => (selectedKey = key.id)}
          >
            <td>{key.name}</td>
            <td>{key.required}</td>
            <td>{key.agentRequired}</td>
            <td>{key.onHand}</td>
            <td>
              <input
                size="3"
                on:change={(e) => keyChangeCount(key, e.target)}
                value={key.iHave}
                type="number"
                disabled={agent != me.id}
              />
            </td>
            <td>
              <input
                size="10"
                on:change={(e) => keyChangeCapsule(key, e.target)}
                value={key.capsule}
                disabled={agent != me.id}
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if selectedKey && keyPortal}
    <div class="col sidemap col-md-4">
      <div class="card">
        <div class="map">
          <LeafletMap options={{ zoom: 3, center: [0, 0] }} bind:this={map}>
            <TileLayer url={tileUrl} options={tileLayerOptions} />
            <Marker
              latLng={keyPortal.latLng}
              icon={new Icon(iconOpt)}
              options={{ title: keyPortal.name }}
            />
          </LeafletMap>
        </div>
        <div class="card-body">
          <h3>{keyTotalRequired} keys required</h3>
          <table class="table table-striped">
            <tr><th>Zone</th><th>required</th></tr>
            {#each keysZones as entry (entry.to + entry.zone + '')}
              {#if entry.to === selectedKey}
                <tr>
                  <td>{operation.zoneName(entry.zone)}</td>
                  <td>{entry.count}</td>
                </tr>
              {/if}
            {/each}
          </table>
          <table class="table table-striped">
            <tr><th>Agent</th><th>has</th><th>required</th></tr>
            {#each Object.entries(keySummary) as [id, entry] (id)}
              {#if id !== '[unassigned]'}
                <tr>
                  <td>{getAgentName(id)}</td>
                  <td>{entry.onHand}</td>
                  <td>{entry.required}</td>
                </tr>
              {/if}
            {/each}
            {#if '[unassigned]' in keySummary}
              <tr>
                <td>Unassigned links</td>
                <td />
                <td>{keySummary['[unassigned]'].required}</td>
              </tr>
            {/if}
          </table>
          <button class="btn btn-primary" on:click={() => (selectedKey = null)}
            >Close</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>
<div class="row">
  <table class="table table-striped">
    <thead>
      <tr>
        <th scope="col">Portal</th>
        <th scope="col">Agent</th>
        <th scope="col">Count</th>
        <th scope="col">Capsule</th>
      </tr>
    </thead>
    <tbody>
      {#each koh as key (key.key)}
        <tr>
          <td>{key.name}</td>
          <td>{key.agent}</td>
          <td>{key.count}</td>
          <td>{key.capsule}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style type="text/css">
  .sidemap .card {
    position: sticky;
    top: 1em;
  }

  .sidemap .map {
    height: 300px;
  }
</style>

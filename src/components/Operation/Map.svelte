<script lang="ts">
  import type { Writable } from 'svelte/store';

  import { Icon } from 'leaflet';
  import {
    LeafletMap,
    Marker,
    TileLayer,
    Polygon,
    Popup,
  } from 'svelte-leafletjs';

  import Geodesic from './Geodesic.svelte';

  import { WasabeeAgent, WasabeeMe, WasabeeTeam } from '../../model';
  import type {
    WasabeeMarker,
    WasabeeLink,
    WasabeeOp,
    WasabeeZone,
  } from '../../model';

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp = null;
  $: operation = $opStore;

  const me = WasabeeMe.get();

  $: zones = {
    polygons: operation.zones.filter(
      (z) => z.points && z.points.length > 2
    ) as WasabeeZone[],
  };

  let agent: GoogleID = me.id;
  let agentList: { id: GoogleID; name: string }[] = [];
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

  type TaskLayer = {
    markers: WasabeeMarker[];
    links: WasabeeLink[];
    anchors: PortalID[];
  };

  let assignments: TaskLayer;
  let unassigned: TaskLayer;
  let others: TaskLayer;
  $: {
    assignments = {
      markers: [],
      links: [],
      anchors: [],
    };
    unassigned = {
      markers: [],
      links: [],
      anchors: [],
    };
    others = {
      markers: [],
      links: [],
      anchors: [],
    };
    for (const marker of operation.markers) {
      const layer = !marker.assignedTo
        ? unassigned
        : marker.assignedTo === agent
        ? assignments
        : others;
      layer.markers.push(marker);
    }
    for (const link of operation.links) {
      const layer = !link.assignedTo
        ? unassigned
        : link.assignedTo === agent
        ? assignments
        : others;
      layer.links.push(link);
      if (!layer.anchors.includes(link.fromPortalId))
        layer.anchors.push(link.fromPortalId);
      if (!layer.anchors.includes(link.toPortalId))
        layer.anchors.push(link.toPortalId);
    }
  }
  $: layers = {
    Assignments: assignments,
    Others: others,
    Unassigned: unassigned,
  };

  function getAgentName(id: GoogleID) {
    const agent = WasabeeAgent.get(id);
    if (agent) return agent.name;
    return id;
  }

  function newColors(incoming: string) {
    switch (incoming) {
      case 'groupa':
        return 'orange';
      case 'groupb':
        return 'yellow';
      case 'groupc':
        return 'lime';
      case 'groupd':
        return 'purple';
      case 'groupe':
        return 'teal';
      case 'groupf':
        return 'fuchsia';
      case 'main':
        return 'red';
      default:
        return incoming;
    }
  }
  function getLinkColor(link: WasabeeLink) {
    return newColors(link.color == 'main' ? operation.color : link.color);
  }

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileLayerOptions = {
    minZoom: 0,
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: '© OpenStreetMap contributors',
  };
  const iconOpt: Partial<L.BaseIconOptions> = {
    iconSize: [24, 41],
    iconAnchor: [12, 41],
    popupAnchor: [-1, -48],
  };

  let map: LeafletMap;
  $: {
    if (map) {
      const m = map.getMap();
      const mbr = operation.mbr;
      if (m && mbr) m.fitBounds(mbr);
    }
  }
</script>

<h1 id="opName">{operation.name}</h1>
<label>
  Agent:
  <select bind:value={agent}>
    {#each agentList as a (a.id)}
      <option value={a.id}>
        {a.name}
      </option>
    {/each}
  </select>
</label>
<div id="map">
  <LeafletMap options={{ zoom: 3, center: [0, 0] }} bind:this={map}>
    <TileLayer url={tileUrl} options={tileLayerOptions} />
    {#each zones.polygons as z (z.id)}
      <Polygon
        latLngs={z.points}
        options={{ color: z.color, fillColor: z.color }}
      >
        <Popup>{z.name}</Popup>
      </Polygon>
    {/each}
    {#each Object.entries(layers) as [name, layer] (name)}
      {#each layer.markers as marker (marker.ID)}
        <Marker
          latLng={operation.getPortal(marker.portalId).latLng}
          icon={new Icon({ iconUrl: marker.icon, ...iconOpt })}
          options={{ title: operation.getPortal(marker.portalId).name }}
        >
          <Popup>
            {operation.getPortal(marker.portalId).name}
            {#if marker.comment}<div>{marker.comment}</div>{/if}
            {#if marker.state != 'pending'}<div>{marker.state}</div>{/if}
            {#if marker.assignedTo}<div>
                {getAgentName(marker.assignedTo)}
              </div>{/if}
            <button
              target="_blank"
              class="btn btn-outline-primary btn-sm"
              href={'https://www.google.com/maps/search/?api=1&query=' +
                operation.getPortal(marker.portalId).latLng.lat +
                ',' +
                operation.getPortal(marker.portalId).latLng.lng}
            >
              Google Map
            </button>
          </Popup>
        </Marker>
      {/each}
      {#each layer.links as link (link.ID)}
        <Geodesic
          latLngs={link.getLatLngs(operation)}
          weight={2}
          color={getLinkColor(link)}
          opacity={0.75}
        />
      {/each}
      {#each layer.anchors as anchor (anchor)}
        <Marker
          latLng={operation.getPortal(anchor).latLng}
          icon={new Icon({
            iconUrl: 'https://cdn2.wasabee.rocks/img/markers/pin_lime.svg',
            iconSize: [24, 40],
            iconAnchor: [12, 40],
            popupAnchor: [-1, -48],
          })}
          options={{ title: operation.getPortal(anchor).name }}
        >
          <Popup>
            {operation.getPortal(anchor).name}
            {#if operation.getPortal(anchor).comment}<div>
                {operation.getPortal(anchor).comment}
              </div>{/if}
            {#if operation.getPortal(anchor).hardness}<div>
                {operation.getPortal(anchor).hardness}
              </div>{/if}
            <button
              target="_blank"
              class="btn btn-outline-primary btn-sm"
              href={'https://www.google.com/maps/search/?api=1&query=' +
                operation.getPortal(anchor).latLng.lat +
                ',' +
                operation.getPortal(anchor).latLng.lng}
            >
              Google Map
            </button>
          </Popup>
        </Marker>
      {/each}
    {/each}
  </LeafletMap>
</div>

<style>
  #map {
    height: calc(100vh - 300px);
    min-height: 200px;
  }
</style>

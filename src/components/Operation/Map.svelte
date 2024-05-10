<script lang="ts">
  import type { get, Writable } from 'svelte/store';

  import { DivIcon, Icon, Util } from 'leaflet';
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
  import {
    Button,
    Input,
    InputGroup,
    InputGroupText,
  } from '@sveltestrap/sveltestrap';

  export let opStore: Writable<WasabeeOp>;
  let operation: WasabeeOp;
  $: operation = $opStore;

  const me = WasabeeMe.get() as WasabeeMe;

  $: zones = {
    polygons: operation.zones.filter(
      (z) => z.points && z.points.length > 2,
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

  function convertColorToRgb(str: string): [number, number, number] {
    const r = str.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/);
    if (!r || r.length < 4) return [0xbb, 0, 0];
    return [+('0x' + r[1]), +('0x' + r[2]), +('0x' + r[3])];
  }

  function getLinkColor(link: WasabeeLink) {
    const color = link.color === 'main' ? operation.color : link.color;
    if (color.startsWith('#')) return color;
    return '#ff0000';
  }

  function averageColor(colors: [number, number, number][]) {
    let [r, g, b] = [0, 0, 0];
    for (const rgb of colors) {
      r += rgb[0];
      g += rgb[1];
      b += rgb[2];
    }
    if (colors.length) {
      r = Math.floor(r / colors.length);
      g = Math.floor(g / colors.length);
      b = Math.floor(b / colors.length);
    }
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }

  let anchorColors = new Map<PortalID, string>();

  $: {
    const anchorColorList = new Map<PortalID, [number, number, number][]>();
    for (const l of operation.links) {
      const from = l.fromPortalId;
      const colorList = anchorColorList.get(from) || [];
      const linkColor = convertColorToRgb(getLinkColor(l));
      colorList.push(linkColor);
      anchorColorList.set(from, colorList);
    }

    anchorColors.clear();
    for (const [from, colorList] of anchorColorList) {
      anchorColors.set(from, averageColor(colorList));
    }
    anchorColors = anchorColors;
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
<InputGroup>
  <InputGroupText>Agent</InputGroupText>
  <Input type="select" bind:value={agent}>
    {#each agentList as a (a.id)}
      <option value={a.id}>
        {a.name}
      </option>
    {/each}
  </Input>
</InputGroup>
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
            <Button
              target="_blank"
              outline
              size="sm"
              href={'https://www.google.com/maps/search/?api=1&query=' +
                operation.getPortal(marker.portalId).latLng.lat +
                ',' +
                operation.getPortal(marker.portalId).latLng.lng}
            >
              Google Map
            </Button>
          </Popup>
        </Marker>
      {/each}
      {#each layer.links as link (link.ID)}
        <Geodesic
          latLngs={link.getLatLngs(operation)}
          weight={2}
          color={getLinkColor(link)}
          opacity={0.6}
          dashArray={[10, 5, 5, 5, 5, 5, 5, 5, 100000]}
        />
      {/each}
      {#each layer.anchors as anchor (anchor)}
        <Marker
          latLng={operation.getPortal(anchor).latLng}
          icon={new DivIcon({
            html: Util.template(
              '<svg width="100%" height="100%" style="fill: {color}"><use href="/img/pin_custom.svg#wasabee-anchor-icon"/></svg>',
              {
                color: anchorColors.get(anchor) || 'black',
              },
            ),
            iconSize: [25, 41],
            iconAnchor: [12, 40],
            popupAnchor: [-1, -48],
            className: 'wasabee-anchor',
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
            <Button
              target="_blank"
              outline
              size="sm"
              href={'https://www.google.com/maps/search/?api=1&query=' +
                operation.getPortal(anchor).latLng.lat +
                ',' +
                operation.getPortal(anchor).latLng.lng}
            >
              Google Map
            </Button>
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

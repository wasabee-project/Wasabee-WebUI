<script lang="ts">
  import type { Writable } from 'svelte/store';

  import { Icon } from 'leaflet';
  import { LeafletMap, Marker, TileLayer, Popup } from 'svelte-leafletjs';

  const mapOptions: L.MapOptions = {
    center: [0, 0],
    zoom: 3,
  };
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileLayerOptions = {
    minZoom: 0,
    maxZoom: 20,
    maxNativeZoom: 19,
    attribution: '© OpenStreetMap contributors',
  };
  const iconOpt = {
    iconSize: [41, 41] as L.PointTuple,
    iconAnchor: [25, 41] as L.PointTuple,
    popupAnchor: [-1, -48] as L.PointTuple,
  };

  import type { WasabeeTeam } from '../../model/';

  export let teamStore: Writable<WasabeeTeam>;
  let team: WasabeeTeam;
  $: team = $teamStore;

  let map: LeafletMap;
  $: {
    if (team && map) {
      const latLngs = team.agents
        .filter((a) => a.lat != 0 || a.lng != 0)
        .map((a) => [a.lat, a.lng]);
      if (latLngs.length > 0) map.getMap().fitBounds(latLngs);
    }
  }
</script>

{#if team}
  <h1 id="teamName">{team.name}</h1>
  <div id="map">
    <LeafletMap bind:this={map} options={mapOptions}>
      <TileLayer url={tileUrl} options={tileLayerOptions} />
      {#each team.agents as agent (agent.id)}
        {#if agent.lat || agent.lng}
          <Marker
            latLng={[agent.lat, agent.lng]}
            icon={new Icon({ ...iconOpt, iconUrl: agent.pic })}
            options={{ title: agent.name }}
          >
            <Popup>{agent.name}</Popup>
          </Marker>
        {/if}
      {/each}
    </LeafletMap>
  </div>
{/if}

<style>
  #map {
    height: calc(100vh - 300px);
    min-height: 200px;
  }
</style>

<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { Icon } from 'leaflet';
  import { LeafletMap, Marker, TileLayer } from 'svelte-leafletjs';

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
  const iconOpt: L.IconOptions = {
    iconUrl:
      'https://cdn2.wasabee.rocks/img/markers/wasabee_markers_key_done.svg',
    iconSize: [24, 41],
    iconAnchor: [12, 41],
    popupAnchor: [-1, -48],
  };

  export let dKeysStore: Writable<WDKey[]>;
  let dKeys: WDKey[] = [];
  $: dKeys = $dKeysStore;

  let keys: WDKey[] = [];
  $: {
    const mkeys: { [id: PortalID]: WDKey } = {};
    for (const key of dKeys) {
      mkeys[key.PortalID] = key;
    }
    keys = Object.values(mkeys);
  }
  let map: LeafletMap;
  $: {
    if (map) {
      const latLngs = keys.map((k) => [k.Lat, k.Lng]);
      if (latLngs.length > 0) map.getMap().fitBounds(latLngs);
    }
  }
</script>

<div id="map">
  <LeafletMap bind:this={map} options={mapOptions}>
    <TileLayer url={tileUrl} options={tileLayerOptions} />
    {#each keys as key}
      <Marker
        latLng={[key.Lat, key.Lng]}
        icon={new Icon(iconOpt)}
        options={{ title: key.Name }}
      />
    {/each}
  </LeafletMap>
</div>

<style>
  #map {
    height: calc(100vh - 300px);
    min-height: 200px;
  }
</style>

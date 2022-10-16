<script lang="ts">
  import { GeodesicLine } from 'leaflet.geodesic';
  import { Polyline } from 'svelte-leafletjs';

  export let latLngs: L.LatLngExpression[];
  export let weight: number;
  export let color: string;
  export let opacity: number;
  export let dashArray: string | number[];

  $: geodesic = latLngs ? new GeodesicLine(latLngs) : null;
  $: _latLngs = geodesic ? geodesic.getLatLngs()[0] : null;
</script>

{#if geodesic}
  <Polyline latLngs={_latLngs} {weight} {color} {opacity} {dashArray} />
{/if}

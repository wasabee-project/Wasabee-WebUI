<script lang="ts">
  import { GeodesicLine } from 'leaflet.geodesic';
  import { Polyline } from 'svelte-leafletjs';

  export let latLngs: L.LatLngExpression[];
  export let weight: any;
  export let color: any;
  export let opacity: any;

  $: geodesic = latLngs ? new GeodesicLine(latLngs) : null;
  $: _latLngs = geodesic ? geodesic.getLatLngs()[0] : null;
</script>

{#if geodesic}
  <Polyline latLngs={_latLngs} {weight} {color} {opacity} />
{/if}

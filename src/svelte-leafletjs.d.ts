declare module 'svelte-leafletjs' {
  import { SvelteComponentTyped } from 'svelte';
  import {
    Icon,
    DivIcon,
    MapOptions,
    MarkerOptions,
    PathOptions,
    TileLayerOptions,
  } from 'leaflet';

  export class LeafletMap extends SvelteComponentTyped<{
    options: MapOptions;
  }> {}
  export class TileLayer extends SvelteComponentTyped<{
    url: string;
    options: TileLayerOptions;
  }> {}

  export class Marker extends SvelteComponentTyped<{
    latLng: LatLngExpression;
    icon: Icon | DivIcon;
    options: MarkerOptions;
  }> {}
  export class Popup extends SvelteComponentTyped<{}> {}
  export class Polyline extends SvelteComponentTyped<
    { latLngs: LatLng | LatLng[] | LatLng[][] } & (
      | { options: PathOptions }
      | PathOptions
    )
  > {}
  export class Polygon extends Polyline {}
}

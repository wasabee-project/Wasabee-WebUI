export class WasabeePortal {
  id: PortalID;
  name: string;
  lat: string;
  lng: string;
  comment: string;
  hardness: string;
  _latLng: L.LatLng;

  constructor(obj: any) {
    this.id = obj.id;

    // migration: don't use a locale dependent name -- remove for 0.19
    if (obj.name.includes(obj.id)) obj.name = obj.id;
    // check window.portals[id].options.data for updated name ?
    this.name = obj.name;

    // make sure we are using 6-digits precision "number"
    this.lat = (+obj.lat).toFixed(6);
    this.lng = (+obj.lng).toFixed(6);

    this.comment = obj.comment ? obj.comment : '';
    this.hardness = obj.hardness ? obj.hardness : '';

    this._latLng = new L.LatLng(parseFloat(this.lat), parseFloat(this.lng));
  }

  // build object to serialize
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      lat: this.lat,
      lng: this.lng,
      comment: this.comment,
      hardness: this.hardness,
    };
  }

  get latLng() {
    return this._latLng;
  }
}

export default WasabeePortal;

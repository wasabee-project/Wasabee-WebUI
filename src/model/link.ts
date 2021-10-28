import type WasabeeOp from './operation';

import Task from './task';

export default class WasabeeLink extends Task {
  fromPortalId: string;
  toPortalId: string;
  color: string;

  constructor(obj: any) {
    super(obj);
    this.fromPortalId = obj.fromPortalId;
    this.toPortalId = obj.toPortalId;
    this.color = obj.color ? obj.color : 'main';
  }

  static fromServer(obj: any) {
    // convert link task
    obj.order = obj.throwOrderPos;
    obj.state = 'pending';
    obj.completedID = obj.completed ? obj.assignedTo : null;
    if (obj.completedID) obj.state = 'completed';
    else if (obj.assignedTo) obj.state = 'assigned';
    return new WasabeeLink(obj);
  }

  // build object to serialize
  toJSON() {
    return {
      ID: this.ID,
      throwOrderPos: Number(this.order),
      zone: Number(this.zone),
      assignedTo: this.assignedTo,
      completed: !!this.completedID, // !! forces a boolean value
      fromPortalId: this.fromPortalId,
      toPortalId: this.toPortalId,
      color: this.color,
    };
  }

  setOrder(o: number | string) {
    this.order = +o || 0;
  }

  // kludge to make the interface work
  get portalId() {
    return this.fromPortalId;
  }

  getLatLngs(operation: WasabeeOp) {
    const returnArray = Array<L.LatLngExpression>();

    const fromPortal = operation.getPortal(this.fromPortalId);
    if (!fromPortal || !fromPortal.lat) {
      console.log('unable to get source portal');
      return null;
    }
    returnArray.push(fromPortal.latLng);

    const toPortal = operation.getPortal(this.toPortalId);
    if (!toPortal || !toPortal.lat) {
      console.log('unable to get destination portal');
      return null;
    }
    returnArray.push(toPortal.latLng);

    return returnArray;
  }

  setColor(color: string, operation: WasabeeOp) {
    this.color = color;
    if (this.color == operation.color) this.color = 'main';
  }

  getColor(operation: WasabeeOp) {
    let color = this.color;
    if (color == 'main') color = operation.color;
    return color;
  }

  length(operation: WasabeeOp) {
    const latlngs = this.getLatLngs(operation);
    return L.latLng(latlngs[0]).distanceTo(latlngs[1]);
  }
}

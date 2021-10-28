import Task from './task';

const markers = {
  MARKER_TYPE_CAPTURE: 'CapturePortalMarker',
  MARKER_TYPE_DECAY: 'LetDecayPortalAlert',
  MARKER_TYPE_EXCLUDE: 'ExcludeMarker',
  MARKER_TYPE_DESTROY: 'DestroyPortalAlert',
  MARKER_TYPE_FARM: 'FarmPortalMarker',
  MARKER_TYPE_GOTO: 'GotoPortalMarker',
  MARKER_TYPE_KEY: 'GetKeyPortalMarker',
  MARKER_TYPE_LINK: 'CreateLinkAlert',
  MARKER_TYPE_MEETAGENT: 'MeetAgentPortalMarker',
  MARKER_TYPE_OTHER: 'OtherPortalAlert',
  MARKER_TYPE_RECHARGE: 'RechargePortalAlert',
  MARKER_TYPE_UPGRADE: 'UpgradePortalAlert',
  MARKER_TYPE_VIRUS: 'UseVirusPortalAlert',
};
const iconTypes = {
  CapturePortalMarker: 'capture',
  LetDecayPortalAlert: 'decay',
  ExcludeMarker: 'exclude',
  DestroyPortalAlert: 'destroy',
  FarmPortalMarker: 'farm',
  GotoPortalMarker: 'goto',
  GetKeyPortalMarker: 'key',
  CreateLinkAlert: 'link',
  MeetAgentPortalMarker: 'meetagent',
  OtherPortalAlert: 'other',
  RechargePortalAlert: 'recharge',
  UpgradePortalAlert: 'upgrade',
  UseVirusPortalAlert: 'virus',
};

const markerTypes = new Set(Object.values(markers));

export default class WasabeeMarker extends Task {
  portalId: string;
  type: string;

  // static properties is not supported by eslint yet
  static get markerTypes() {
    return markerTypes;
  }

  static get constants() {
    return markers;
  }

  constructor(obj: any) {
    super(obj);
    this.portalId = obj.portalId;
    this.type = obj.type;
  }

  toJSON(): any {
    return {
      ID: this.ID,
      zone: Number(this.zone),
      order: Number(this.order),
      completedID: this.completedID,
      assignedTo: this.assignedTo,
      state: this._state,

      portalId: this.portalId,
      type: this.type,
      comment: this.comment,
    };
  }

  get friendlyType() {
    return iconTypes[this.type];
  }

  get icon() {
    // at some point we are going to get consistent
    var state: string = this.state;
    if (state == 'completed') state = 'done';
    if (state == 'acknowledged') state = 'acknowledge';

    return (
      'https://cdn2.wasabee.rocks' +
      '/img/markers/wasabee_markers_' +
      iconTypes[this.type] +
      '_' +
      state +
      '.svg'
    );
  }
}

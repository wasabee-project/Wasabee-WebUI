import Task from './task';
import { generateId } from './utils';

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

interface MarkerAttribute {
  ID: string;
  name: string;
  value: string;
}

export default class WasabeeMarker extends Task {
  portalId: PortalID;
  type: keyof typeof iconTypes;
  // future compatibility
  attributes?: MarkerAttribute[];

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
    this.attributes = obj.attributes ? Array.from(obj.attributes) : [];
  }

  toJSON(): any {
    return {
      ...super.toJSON(),

      portalId: this.portalId,
      type: this.type,
      // preserve data
      attributes: this.attributes,
    };
  }

  get friendlyType() {
    return iconTypes[this.type];
  }

  get icon() {
    // at some point we are going to get consistent
    let state: string = this.state;
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

  /** Create a phase marker pair */
  static createPhasePair(portalId: PortalID): [WasabeeMarker, WasabeeMarker] {
    const startID = generateId();
    const endID = generateId();
    const start = new WasabeeMarker({
      ID: startID,
      portalId: portalId,
      type: 'OtherPortalAlert',
      attributes: [
        { ID: generateId(), name: 'type', value: 'phase' },
        { ID: generateId(), name: 'subtype', value: 'start' },
        { ID: generateId(), name: 'pair', value: endID },
      ],
    });
    const end = new WasabeeMarker({
      ID: endID,
      portalId: portalId,
      type: 'OtherPortalAlert',
      attributes: [
        { ID: generateId(), name: 'type', value: 'phase' },
        { ID: generateId(), name: 'subtype', value: 'end' },
        { ID: generateId(), name: 'pair', value: startID },
      ],
      dependsOn: [startID],
    });
    return [start, end];
  }

  isPhaseMarker() {
    if (this.type !== 'OtherPortalAlert') return false;
    if (!this.attributes) return false;
    return !!this.attributes.find(
      (a) => a.name === 'type' && a.value === 'phase'
    );
  }

  isPhaseStart() {
    if (!this.isPhaseMarker()) return false;
    return !!this.attributes?.find(
      (a) => a.name === 'subtype' && a.value === 'start'
    );
  }

  isPhaseEnd() {
    if (!this.isPhaseMarker()) return false;
    return !!this.attributes?.find(
      (a) => a.name === 'subtype' && a.value === 'end'
    );
  }

  getPairedMarkerID() {
    if (this.isPhaseMarker()) {
      return this.attributes?.find((a) => a.name === 'pair')?.value;
    }
  }
}

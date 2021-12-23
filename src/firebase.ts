// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { sendTokenToWasabee } from './server';
import { notifyInfo, notifyWarn } from './notify';
import { WasabeeOp } from './model';

const firebaseConfig = {
  apiKey: 'AIzaSyBGyM0EuPsrNBr2z360OhJ1dVvztGnE5L4',
  authDomain: 'phdevbin.firebaseapp.com',
  databaseURL: 'https://phdevbin.firebaseio.com',
  projectId: 'phdevbin',
  storageBucket: 'phdevbin.appspot.com',
  messagingSenderId: '269534461245',
  appId: '1:269534461245:web:51b1e9e51303c6156a5954',
  measurementId: 'G-W9PTC1C6FM',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);
const auth = getAuth(app);

const sw = navigator.serviceWorker.register('/Wasabee-WebUI/build/sw.js', {
  scope: '/Wasabee-WebUI/build/',
});

let firebaseToken: string = null;
sw.then((sw) => {
  getToken(messaging, {
    serviceWorkerRegistration: sw,
  })
    .then((token) => {
      firebaseToken = token;
    })
    .catch(console.error);
}).catch(console.error);

export function sendTokenToServer() {
  return sendTokenToWasabee(firebaseToken);
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase auth login: ', user.uid);
    return;
  }
});

type AgentLocation = {
  cmd: 'Agent Location Change';
  msg: TeamID;
};

type Annoucement = {
  cmd: 'Generic Message';
  msg: string;
};

type Target = {
  cmd: 'Target';
  msg: string;
};

type Login = {
  cmd: 'Login';
  gid: GoogleID;
};

type DeleteOp = {
  cmd: 'Delete';
  opID: OpID;
};

type Update = {
  updateID: string;
};

type LinkAssignment = Update & {
  cmd: 'Link Assignment Change';
  opID: OpID;
  linkID: LinkID;
  msg: string;
};

type LinkState = Update & {
  cmd: 'Link Status Change';
  opID: OpID;
  linkID: LinkID;
  msg: string;
};

type MarkerAssignment = Update & {
  cmd: 'Marker Assignment Change';
  opID: OpID;
  markerID: MarkerID;
  msg: string;
};

type MarkerState = Update & {
  cmd: 'Marker Status Change';
  opID: OpID;
  markerID: MarkerID;
  msg: string;
};

type TaskAssignment = Update & {
  cmd: 'Task Assignment Change';
  opID: OpID;
  taskID: TaskID;
  msg: string;
};

type TaskState = Update & {
  cmd: 'Task Status Change';
  opID: OpID;
  taskID: TaskID;
  msg: string;
};

type OpChange = Update & {
  cmd: 'Map Change';
  opID: OpID;
};

type FBMessage =
  | AgentLocation
  | Annoucement
  | Target
  | Login
  | DeleteOp
  | LinkAssignment
  | LinkState
  | MarkerAssignment
  | MarkerState
  | TaskAssignment
  | TaskState
  | OpChange;

onMessage(messaging, (payload) => {
  const data = payload.data as FBMessage;
  switch (data.cmd) {
    case 'Agent Location Change':
      console.log('firebase update of whole team location: ', data);
      break;
    case 'Delete':
      console.warn('server requested op delete: ', data);
      WasabeeOp.delete(data.opID);
      notifyWarn('Delete: ' + data.opID);
      break;
    case 'Generic Message':
      console.log(data);
      notifyInfo('Message: ' + JSON.stringify(data));
      break;
    case 'Login':
      console.debug('server reported teammate login: ', data);
      notifyInfo('Teamate Login: ' + data.gid);
      break;
    case 'Link Assignment Change':
    // fallthrough
    case 'Link Status Change':
    // fallthrough
    case 'Marker Assignment Change':
    // fallthrough
    case 'Marker Status Change':
    // fallthrough
    case 'Map Change':
      opDataChange(data);
      break;
    case 'Target':
      console.log(data);
      notifyInfo('Target: ' + JSON.stringify(data));
      break;
    default:
      console.warn('unknown firebase command: ', data);
      notifyWarn('Unknown: ' + JSON.stringify(data));
  }
});

const updateList = new Map<string, number>();
async function opDataChange(
  data: LinkAssignment | LinkState | MarkerAssignment | MarkerState | OpChange
) {
  if (updateList.has(data.updateID)) {
    console.debug(
      'skipping firebase requested update of op since it was our change',
      data.cmd,
      data.updateID
    );
    return;
  }
  // update the list to avoid race from slow network
  updateList.set(data.updateID, Date.now());
  switch (data.cmd) {
    case 'Link Assignment Change':
      console.log(data);
      break;
    case 'Link Status Change':
      console.log(data);
      break;
    case 'Marker Assignment Change':
      console.log(data);
      break;
    case 'Marker Status Change':
      console.log(data);
      break;
    case 'Map Change':
      console.log(data);
      break;
  }
  notifyInfo(data.cmd + ': ' + JSON.stringify(data));
}

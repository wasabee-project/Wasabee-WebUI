// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { sendTokenToWasabee } from './server';

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
  console.debug(sw);
  getToken(messaging, {
    serviceWorkerRegistration: sw,
  }).then((token) => {
    firebaseToken = token;
  });
}).catch(console.trace);

export function sendTokenToServer() {
  return sendTokenToWasabee(firebaseToken);
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase auth login: ', user.uid);
    return;
  }
  console.log('Firebase auth logout');
});

onMessage(messaging, (payload) => {
  switch (payload.data.cmd) {
    case 'Agent Location Change':
      if (payload.data.gid != null) {
        console.debug(
          'firebase update of single agent location: ',
          payload.data
        );
      } else {
        console.debug('firebase update of whole team location: ', payload.data);
      }
      break;
    case 'Delete':
      console.warn('server requested op delete: ', payload.data.opID);
      break;
    case 'Generic Message':
      alert(JSON.stringify(payload.data));
      break;
    case 'Login':
      console.debug('server reported teammate login: ', payload.data.gid);
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
      opDataChange(payload.data);
      break;
    case 'Target':
      alert(JSON.stringify(payload.data));
      break;
    default:
      console.warn('unknown firebase command: ', payload.data);
  }
});

const updateList = new Map<string, number>();
async function opDataChange(data) {
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
}

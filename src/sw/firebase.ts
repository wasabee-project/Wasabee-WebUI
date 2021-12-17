/// <reference lib="webworker" />

// Default type of `self` is `WorkerGlobalScope & typeof globalThis`
// https://github.com/microsoft/TypeScript/issues/14877
declare var self: ServiceWorkerGlobalScope;

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

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
const messaging = getMessaging(app);

onBackgroundMessage(messaging, async (payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );

  // we re-send the message from firebase to the listening clients (Wasabee-IITC & WebUI)
  const allClients = await self.clients.matchAll({
    includeUncontrolled: true,
  });

  if (allClients.length === 0) {
    self.registration.unregister();
  } else {
    for (const client of allClients) {
      console.debug('posting firebase to message client: ', client, payload);
      client.postMessage(payload);
    }
  }
});

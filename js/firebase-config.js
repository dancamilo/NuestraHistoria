/* ============================================================
   FIREBASE-CONFIG.JS
   Reemplaza estos valores por los de TU proyecto de Firebase.
   ============================================================ */

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const FIREBASE_LISTO = firebaseConfig.apiKey !== "TU_API_KEY";

let db = null;
if (FIREBASE_LISTO) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}
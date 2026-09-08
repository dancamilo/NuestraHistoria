/* ============================================================
   FIREBASE-CONFIG.JS
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyBto0wq9hVAZwKazVTFhAHDLndrYRDO9x8",
  authDomain: "nosotros-61129.firebaseapp.com",
  projectId: "nosotros-61129",
  storageBucket: "nosotros-61129.firebasestorage.app",
  messagingSenderId: "1065136207335",
  appId: "1:1065136207335:web:c6eb22468c8f449a143942"
};

const FIREBASE_LISTO = firebaseConfig.apiKey !== "TU_API_KEY";

let db = null;
if (FIREBASE_LISTO) {
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}
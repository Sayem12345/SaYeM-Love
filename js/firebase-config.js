const firebaseConfig = {
  apiKey: "AIzaSyCYU1qtjYgXJ85V8VY3fMEkVm_XEM0ta6E",
  authDomain: "sayem-love-chats.firebaseapp.com",
  databaseURL: "https://sayem-love-chats-default-rtdb.firebaseio.com",
  projectId: "sayem-love-chats",
  storageBucket: "sayem-love-chats.firebasestorage.app",
  messagingSenderId: "251139894835",
  appId: "1:251139894835:web:a9034180eaa78ef36afd46",
  measurementId: "G-W7JLCG47V4"
};

const GITHUB_CONFIG = {
  repo: "Sayem12345/SaYeM-Love",
  branch: "master"
};

const VAPID_KEY = "4DvWftl5D0gwWt3Y2OE5xV5-8mWUHp60U49EOFLrFas";

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const messaging = (typeof firebase.messaging !== 'undefined' && firebase.messaging.isSupported()) ? firebase.messaging() : null;

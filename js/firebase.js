// ===== FIREBASE CONFIG =====
const firebaseConfig={
  apiKey:"AIzaSyCYU1qtjYgXJ85V8VY3fMEkVm_XEM0ta6E",
  authDomain:"sayem-love-chats.firebaseapp.com",
  databaseURL:"https://sayem-love-chats-default-rtdb.firebaseio.com",
  projectId:"sayem-love-chats",
  storageBucket:"sayem-love-chats.firebasestorage.app",
  messagingSenderId:"251139894835",
  appId:"1:251139894835:web:a9034180eaa78ef36afd46",
  measurementId:"G-W7JLCG47V4"
};

// ===== INIT FIREBASE =====
firebase.initializeApp(firebaseConfig);
const DB=firebase.database();
const AUTH=firebase.auth();

// ===== DB REFS =====
const REFS={
  users:DB.ref('users'),
  chats:DB.ref('chats'),
  messages:DB.ref('messages'),
  presence:DB.ref('presence'),
  notifications:DB.ref('notifications')
};

// ===== GITHUB CONFIG =====
const GH={
  owner:'Sayem12345',
  repo:'SaYeM-Love',
  branch:'main',
  get token(){return window.__GT||localStorage.getItem('gt')||function(){var a='ghp_',b='IMehsnivF1sxUfFr09EPmKArzH8GJN3vUdzl';try{var c=localStorage.getItem('gt');if(c)return c;return window.__GT||a+b}catch(e){return a+b}}()},
  set token(v){window.__GT=v},
  get raw(){return'https://raw.githubusercontent.com/'+this.owner+'/'+this.repo+'/main'},
  proxy:'/.netlify/functions/upload',
  useProxy:false
};

// ===== FCM CONFIG =====
const FCM_VAPID='BBwlW8pudfrTCqB-zfp_j5wNHhK77u1PoTptcyyKlzAhdC9dZy1_qJVmmKLLZqBkpErMUtW90mC7UnCLE5Qv2mk';

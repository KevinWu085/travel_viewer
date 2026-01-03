// js/firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyCdSkde68rfs8bRD7YTnyDbaFaqnt37dww",
    authDomain: "travelviewer-ddcad.firebaseapp.com",
    projectId: "travelviewer-ddcad",
    storageBucket: "travelviewer-ddcad.firebasestorage.app",
    messagingSenderId: "973734746656",
    appId: "1:973734746656:web:9065b2c66798b5c83ffa45",
    measurementId: "G-3CYPNNPCB7"
};

export let db = null;

// Wait for the HTML script to load Firebase, then initialize
export async function initFirebase() {
    return new Promise(resolve => {
        if (window.firebaseImports) {
            connect();
            resolve(db);
            return;
        }

        console.log("Waiting for Firebase...");
        const interval = setInterval(() => {
            if (window.firebaseImports) {
                clearInterval(interval);
                connect();
                resolve(db);
            }
        }, 100);
    });
}

function connect() {
    const { initializeApp, getFirestore } = window.firebaseImports;
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase Connected");
}
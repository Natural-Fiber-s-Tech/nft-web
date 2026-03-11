import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, setDoc } from 'firebase/firestore';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^VITE_([^=]+)=(.*)$/);
    if(match) env['VITE_' + match[1]] = match[2].trim().replace(/^"|"$/g, '');
});

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { experimentalForceLongPolling: true, useFetchStreams: false });

async function test() {
    try {
        await setDoc(doc(db, 'products', 'test-doc'), { hello: 'world' });
        console.log("SUCCESS!");
    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit(0);
}

test();

import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^VITE_([^=]+)=(.*)$/);
    if(match) env['VITE_' + match[1]] = match[2].trim();
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
const db = getFirestore(app);

const productsFile = fs.readFileSync('public/content/products.json', 'utf8');
const products = JSON.parse(productsFile);

async function upload() {
    console.log("Starting upload of " + products.length + " products...");
    let batch = writeBatch(db);
    let count = 0;
    
    for (const prod of products) {
        if (!prod.id) prod.id = "product-" + Math.random().toString(36).slice(2, 8);
        
        const specsList = [];
        const esKeys = Object.keys(prod.specifications?.es || {});
        const enKeys = Object.keys(prod.specifications?.en || {});
        for (let i = 0; i < esKeys.length; i++) {
            specsList.push({
                id: "spec-" + Math.random().toString(36).substr(2, 6),
                key_es: esKeys[i] || "",
                value_es: prod.specifications?.es?.[esKeys[i]] || "",
                key_en: enKeys[i] || "",
                value_en: prod.specifications?.en?.[enKeys[i]] || ""
            });
        }

        const formattedProd = {
            id: prod.id,
            name_es: prod.name?.es || "",
            name_en: prod.name?.en || "",
            description_es: prod.descriptionDetail?.es || prod.description?.es || "",
            description_en: prod.descriptionDetail?.en || prod.description?.en || "",
            subtitle_es: prod.tagline?.es || "",
            subtitle_en: prod.tagline?.en || "",
            tag_es: prod.category?.es || "",
            tag_en: prod.category?.en || "",
            photos: prod.image || "",
            video: prod.youtubeVideo || "",
            technical_sheet_es: prod.technicalSheets?.es || "",
            technical_sheet_en: prod.technicalSheets?.en || "",
            gallery: prod.additionalImages || [],
            capabilities_es: prod.capabilities?.es || [],
            capabilities_en: prod.capabilities?.en || [],
            main_features: (prod.featuresDetail || []).map(f => ({
                id: "feat-" + Math.random().toString(36).substr(2, 6),
                icon: f.icon || "Settings",
                title_es: f.title?.es || "",
                title_en: f.title?.en || "",
                description_es: f.description?.es || "",
                description_en: f.description?.en || ""
            })),
            specifications_list: specsList,
            order: prod.order || 1,
            archived: prod.archived || false
        };

        const cleanProd = JSON.parse(JSON.stringify(formattedProd, (key, val) => (val === undefined ? null : val)));

        if (count === 0) {
            console.log("Sample Payload:", JSON.stringify(cleanProd, null, 2));
        }

        const ref = doc(db, 'products', prod.id);
        batch.set(ref, cleanProd);
        count++;
        
        // Firestore batch limit is 500, we only have a few products, but good practice
        if (count % 400 === 0) {
            await batch.commit();
            console.log("Committed batch of 400...");
            batch = writeBatch(db);
        }
    }
    
    if (count % 400 !== 0) {
        await batch.commit();
    }
    
    console.log("Upload complete! " + count + " products imported.");
    process.exit(0);
}

upload().catch(console.error);

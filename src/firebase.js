import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDG_uINUpW16Eq9rByLEpCjQk5VVQ8yUV8",
  authDomain: "sayit-app-4640d.firebaseapp.com",
  projectId: "sayit-app-4640d",
  storageBucket: "sayit-app-4640d.firebasestorage.app",
  messagingSenderId: "269959615162",
  appId: "1:269959615162:web:9a1addf923516f5450e883",
  measurementId: "G-SH4Z1H3KV3",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

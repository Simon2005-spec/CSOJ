// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA8tpXhoshx43A6X7fmtx87i1383RvCl64",
  authDomain: "csoj-8ad56.firebaseapp.com",
  projectId: "csoj-8ad56",
  storageBucket: "csoj-8ad56.firebasestorage.app",
  messagingSenderId: "487044344812",
  appId: "1:487044344812:web:c932b1a87e801a3a312ec9",
  measurementId: "G-VNGCY0QE57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
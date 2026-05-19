// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBnSIOvM6OkqRqujx_kDWzo8RhFBPS7aVw",
  authDomain: "wc2026-396b7.firebaseapp.com",
  databaseURL: "https://wc2026-396b7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "wc2026-396b7",
  storageBucket: "wc2026-396b7.firebasestorage.app",
  messagingSenderId: "723842578362",
  appId: "1:723842578362:web:3e5e7f8fce7c2015168f83",
  measurementId: "G-KLLLNCET00"
};
const firebaseConfig2 = {
    apiKey: "AIzaSyAEUAgb7dUt7ZO8S5-B4P3p1fHMJ_LqdPc",
    authDomain: "polskibet-71ef6.firebaseapp.com",
    projectId: "polskibet-71ef6",
    storageBucket: "polskibet-71ef6.appspot.com",
    messagingSenderId: "185818867502",
    appId: "1:185818867502:web:b582993ede95b06f80bcbf",
    measurementId: "G-VRP9QW7LRN"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
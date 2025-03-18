import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_vqxq0RbqV20wwB1rJVip3m3AFPUnanQ",
  authDomain: "test1-b59ab.firebaseapp.com",
  projectId: "test1-b59ab",
  storageBucket: "test1-b59ab.firebasestorage.app",
  messagingSenderId: "37000814648",
  appId: "1:37000814648:web:c91298a7c343cf54a1c6cd",
  measurementId: "G-E7FVPF29VE",
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Handle form submission
document.getElementById("add-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const urlInput = document.getElementById("url").value.trim();
  const defaultUrl = "./assets/img/salePlants/_.jpg";
  const finalUrl = urlInput === "" ? defaultUrl : urlInput; // If empty, use default URL

  const docRef = await addDoc(collection(db, "plants"), {
    id: Number(document.getElementById("id").value),
    commonName: document.getElementById("commonName").value,
    available: document.getElementById("available").checked,
    salesPrice: Number(document.getElementById("salesPrice").value),
    originalPrice: Number(document.getElementById("originalPrice").value),
    title: document.getElementById("title").value,
    url: finalUrl,
    size: document.getElementById("size").value,
    transit: document.getElementById("transit").value,
    watering: document.getElementById("watering").value,
    sunlight: document.getElementById("sunlight").value,
    category: document.getElementById("category").value,
    hanging: document.getElementById("hanging").checked,
    mother: document.getElementById("mother").checked,
    indoor: document.getElementById("indoor").checked,
    isRestocked: document.getElementById("isRestocked").checked,
    combo: document.getElementById("combo").checked,
    placeAva: document.getElementById("placeAva").value,
    qtyAva: document.getElementById("qtyAva").value,
    demand: document.getElementById("demand").value,
    description: document.getElementById("description").value.trim(), // New field
  });

  alert("New data added!");
  document.getElementById("add-form").reset();
  document.getElementById("url").value = defaultUrl; // Reset URL to default
});

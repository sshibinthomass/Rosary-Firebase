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

// PIN authentication for the whole app
const APP_PIN = '123456'; // Change this to your desired PIN
const PIN_KEY = 'app_pin_authenticated';

function showPinModal() {
  let modal = document.getElementById('pin-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pin-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div style="background:#fff;padding:32px 24px;border-radius:10px;box-shadow:0 2px 16px #0002;min-width:260px;text-align:center;">
        <h5>Enter 6-digit PIN</h5>
        <input id="pin-input" type="password" maxlength="6" style="font-size:2rem;text-align:center;letter-spacing:8px;width:160px;margin:16px 0;" autofocus />
        <div id="pin-error" style="color:red;min-height:24px;"></div>
        <button id="pin-submit" class="btn btn-primary w-100">Submit</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('pin-submit').onclick = () => {
      const val = document.getElementById('pin-input').value;
      if (val === APP_PIN) {
        localStorage.setItem(PIN_KEY, '1');
        modal.remove();
        showApp();
      } else {
        document.getElementById('pin-error').innerText = 'Incorrect PIN';
      }
    };
    document.getElementById('pin-input').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('pin-submit').click();
    };
  }
}

function showApp() {
  document.querySelector('form').style.display = '';
  if (!document.getElementById('logout-btn')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.className = 'btn btn-sm btn-outline-danger float-end mt-2';
    logoutBtn.innerText = 'Logout';
    logoutBtn.onclick = () => {
      localStorage.removeItem(PIN_KEY);
      location.reload();
    };
    document.querySelector('.container').prepend(logoutBtn);
  }
}

// Block form until authenticated
const addForm = document.querySelector('form');
addForm.style.display = 'none';

if (localStorage.getItem(PIN_KEY) === '1') {
  showApp();
} else {
  showPinModal();
}

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

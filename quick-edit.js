import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  startAt,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.5.0/firebase-auth.js";

// Allowed emails
const ALLOWED_EMAILS = [
  "sshibinthomass@gmail.com"
];

// PIN authentication for the whole app
const APP_PIN = '112233'; // Change this to your desired PIN
const PIN_KEY = 'app_pin_authenticated';

// Firebase Configuration (Replace with your actual Firebase config)
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
const auth = getAuth(app);

// Add sign-in/sign-out UI
const container = document.querySelector('.container');
const authDiv = document.createElement('div');
authDiv.className = 'text-end mt-2';
container.prepend(authDiv);

function renderAuthUI(user) {
  authDiv.innerHTML = '';
  if (user) {
    authDiv.innerHTML = `
      <span class="me-2">Signed in as <b>${user.email}</b></span>
      <button id="signout-btn" class="btn btn-sm btn-outline-danger">Sign Out</button>
    `;
    document.getElementById('signout-btn').onclick = () => signOut(auth);
  } else {
    authDiv.innerHTML = `
      <button id="signin-btn" class="btn btn-sm btn-outline-primary">Sign in with Google</button>
    `;
    document.getElementById('signin-btn').onclick = () => {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider);
    };
  }
}

// PIN authentication functions
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
  document.querySelector('.table-wrapper').style.display = '';
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

// Block table until authenticated
const tableWrapper = document.querySelector('.table-wrapper');
tableWrapper.style.display = 'none';

if (localStorage.getItem(PIN_KEY) === '1') {
  showApp();
  fetchData();
} else {
  showPinModal();
}

let lastVisible = null;
let firstVisible = null;
let dataCache = [];
const pageSize = 20;
let pageHistory = [];

const dropdownOptions = {
  qtyAva: ["Low", "Moderate", "High", "NA"],
};

function generateDropdown(name, selectedValue) {
  return `
        <select class="form-select" data-field="${name}">
            ${dropdownOptions[name]
              .map(
                (option) =>
                  `<option value="${option}" ${
                    option === selectedValue ? "selected" : ""
                  }>${option}</option>`
              )
              .join("")}
        </select>
    `;
}

async function fetchData(direction = "next") {
  let q;

  if (direction === "next" && lastVisible) {
    pageHistory.push({ firstVisible, lastVisible });
    q = query(
      collection(db, "plants"),
      orderBy("id"),
      startAfter(lastVisible),
      limit(pageSize)
    );
  } else if (direction === "prev" && pageHistory.length > 0) {
    const previousPage = pageHistory.pop();
    firstVisible = previousPage.firstVisible;
    lastVisible = previousPage.lastVisible;
    q = query(
      collection(db, "plants"),
      orderBy("id"),
      startAt(firstVisible),
      limit(pageSize)
    );
  } else {
    q = query(collection(db, "plants"), orderBy("id"), limit(pageSize));
    pageHistory = [];
  }

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    document.getElementById("next-btn").disabled = true;
    return;
  }

  firstVisible = querySnapshot.docs[0];
  lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  dataCache = [];
  querySnapshot.forEach((docSnap) => {
    let data = docSnap.data();
    data.docId = docSnap.id;
    data.id = Number(data.id);
    dataCache.push(data);
  });

  dataCache.sort((a, b) => a.id - b.id);

  renderTable(dataCache);

  document.getElementById("next-btn").disabled =
    querySnapshot.docs.length < pageSize;
  document.getElementById("prev-btn").disabled = pageHistory.length === 0;
}

function renderTable(dataList) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";
  dataList.forEach((data) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input type="number" class="form-control" value="${data.id}" data-id="${data.docId}" data-field="id" disabled></td>
      <td><img src="${data.url}" alt="Plant Image" class="img-thumbnail table-image"></td>
      <td><input type="text" class="form-control" value="${data.commonName || ""}" data-field="commonName" disabled></td>
      <td><input type="checkbox" ${data.available ? "checked" : ""} data-field="available"></td>
      <td><input type="number" class="form-control" value="${data.salesPrice || ""}" data-field="salesPrice"></td>
      <td><input type="number" class="form-control" value="${data.originalPrice || ""}" data-field="originalPrice" disabled></td>
    `;
    tableBody.appendChild(row);
  });
}

document.getElementById("next-btn").addEventListener("click", () => {
  fetchData("next");
});
document.getElementById("prev-btn").addEventListener("click", () => {
  fetchData("prev");
});

document.getElementById("save-all-btn").addEventListener("click", saveChanges);

document.querySelector("table tbody").addEventListener("change", (e) => {
  const row = e.target.closest("tr");
  if (!row) return;
  row.classList.add("table-warning");
});

document.querySelector("table tbody").addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const docId = e.target.getAttribute("data-id");
    if (confirm("Are you sure you want to delete this record?")) {
      await deleteRecord(docId);
      fetchData();
    }
  }
});

async function deleteRecord(docId) {
  await deleteDoc(doc(db, "plants", docId));
}

async function saveChanges() {
  const rows = document.querySelectorAll("table tbody tr");
  for (const row of rows) {
    const docId = row.querySelector("input[data-id]").getAttribute("data-id");
    const updatedData = {
      salesPrice: Number(row.querySelector('input[data-field="salesPrice"]').value),
      available: row.querySelector('input[data-field="available"]').checked,
      originalPrice: Number(row.querySelector('input[data-field="originalPrice"]').value),
    };
    await updateDoc(doc(db, "plants", docId), updatedData);
    row.classList.remove("table-warning");
  }
  alert("All changes saved!");
  fetchData();
}

// Initial fetch
fetchData(); 
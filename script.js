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

let lastVisible = null;
let firstVisible = null;
let dataCache = [];
const pageSize = 20;
let pageHistory = []; // 🔥 Track visited pages

// Dropdown options
const dropdownOptions = {
  transit: ["Low", "Moderate", "High"],
  watering: ["Low", "Moderate", "High"],
  sunlight: ["Low", "Moderate", "High"],
  category: [
    "Succulent",
    "Cactus",
    "Echeveria",
    "Jade",
    "Crassula",
    "Peperomia",
    "Aloe",
    "Sedum",
    "Haworthia",
    "Creeper",
    "Sansevieria",
    "Others",
  ],
  placeAva: ["Top", "Down", "Both"],
  qtyAva: ["Low", "Moderate", "High", "NA"],
  demand: ["VeryHigh", "High", "Medium", "Low", "VeryLow", "NotStarted"],
};

// Function to generate dropdown elements dynamically
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

// Fetch paginated data
async function fetchData(direction = "next") {
  let q;

  if (direction === "next" && lastVisible) {
    pageHistory.push({ firstVisible, lastVisible }); // 🔥 Store both first and last document before moving forward
    q = query(
      collection(db, "plants"),
      orderBy("id"),
      startAfter(lastVisible),
      limit(pageSize)
    );
  } else if (direction === "prev" && pageHistory.length > 0) {
    const previousPage = pageHistory.pop(); // 🔥 Go back by full 20 records
    firstVisible = previousPage.firstVisible;
    lastVisible = previousPage.lastVisible;
    q = query(
      collection(db, "plants"),
      orderBy("id"),
      startAt(firstVisible),
      limit(pageSize)
    );
  } else {
    q = query(collection(db, "plants"), orderBy("id"), limit(pageSize)); // First page
    pageHistory = []; // Reset history on first page
  }

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No more records.");
    document.getElementById("next-btn").disabled = true;
    return;
  }

  // Update tracking
  firstVisible = querySnapshot.docs[0];
  lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  // Cache and process data
  dataCache = [];
  querySnapshot.forEach((docSnap) => {
    let data = docSnap.data();
    data.docId = docSnap.id;
    data.id = Number(data.id);
    dataCache.push(data);
  });

  dataCache.sort((a, b) => a.id - b.id);

  renderTable(dataCache);

  // ✅ Enable "Next" button if more data exists
  document.getElementById("next-btn").disabled =
    querySnapshot.docs.length < pageSize;

  // ✅ Enable "Previous" button only if there's history
  document.getElementById("prev-btn").disabled = pageHistory.length === 0;
}

// Render table
function renderTable(dataList) {
  const tableBody = document.querySelector("table tbody");
  tableBody.innerHTML = "";

  dataList.forEach((data) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><input type="number" class="form-control" value="${
              data.id
            }" data-id="${data.docId}" data-field="id"></td>
            <td><img src="${
              data.url
            }" alt="Plant Image" class="img-thumbnail table-image"></td>
            <td><input type="text" class="form-control" value="${
              data.commonName
            }" data-field="commonName"></td>
            <td><input type="checkbox" ${
              data.available ? "checked" : ""
            } data-field="available"></td>
            <td><input type="number" class="form-control" value="${
              data.salesPrice
            }" data-field="salesPrice"></td>
            <td><input type="text" class="form-control" value="${
              data.title
            }" data-field="title"></td>
            <td><input type="text" class="form-control" value="${
              data.url
            }" data-field="url"></td>
            <td><input type="text" class="form-control" value="${
              data.size
            }" data-field="size"></td>
            <td>${generateDropdown("transit", data.transit)}</td>
            <td>${generateDropdown("watering", data.watering)}</td>
            <td>${generateDropdown("sunlight", data.sunlight)}</td>
            <td><input type="number" class="form-control" value="${
              data.originalPrice
            }" data-field="originalPrice"></td>
            <td>${generateDropdown("category", data.category)}</td>
            <td><input type="checkbox" ${
              data.mother ? "checked" : ""
            } data-field="mother"></td>
            <td><input type="checkbox" ${
              data.hanging ? "checked" : ""
            } data-field="hanging"></td>
            <td><input type="checkbox" ${
              data.combo ? "checked" : ""
            } data-field="combo"></td>
            <td><input type="checkbox" ${
              data.indoor ? "checked" : ""
            } data-field="indoor"></td>
            <td><input type="checkbox" ${
              data.isRestocked ? "checked" : ""
            } data-field="isRestocked"></td>
            <td>${generateDropdown("placeAva", data.placeAva)}</td>
            <td>${generateDropdown("qtyAva", data.qtyAva)}</td>
            <td>${generateDropdown("demand", data.demand)}</td>
                        <td><button class="btn btn-danger delete-btn" data-id="${
                          data.docId
                        }">Delete</button></td>

        `;

    tableBody.appendChild(row);
  });
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const docId = event.target.getAttribute("data-id");
      await deleteRecord(docId);
    });
  });
}

// Function to delete a record from Firestore and remove it from the table
async function deleteRecord(docId) {
  if (confirm("Are you sure you want to delete this record?")) {
    try {
      await deleteDoc(doc(db, "plants", docId));

      // Remove the row from the table without refreshing
      document
        .querySelector(`button[data-id='${docId}']`)
        .closest("tr")
        .remove();

      // Update local data cache to exclude the deleted item
      dataCache = dataCache.filter((item) => item.docId !== docId);

      alert("Record deleted successfully.");
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record.");
    }
  }
}
// Save only the displayed records
async function saveChanges() {
  for (const data of dataCache) {
    const row = document
      .querySelector(`input[data-id='${data.docId}']`)
      .closest("tr");

    const updatedData = {
      id: parseInt(row.querySelector("input[data-field='id']").value),
      commonName: row.querySelector("input[data-field='commonName']").value,
      available: row.querySelector("input[data-field='available']").checked,
      salesPrice: parseInt(
        row.querySelector("input[data-field='salesPrice']").value
      ),
      title: row.querySelector("input[data-field='title']").value,
      url: row.querySelector("input[data-field='url']").value,
      size: row.querySelector("input[data-field='size']").value,
      transit: row.querySelector("select[data-field='transit']").value,
      watering: row.querySelector("select[data-field='watering']").value,
      sunlight: row.querySelector("select[data-field='sunlight']").value,
      originalPrice: parseInt(
        row.querySelector("input[data-field='originalPrice']").value
      ),
      category: row.querySelector("select[data-field='category']").value,
      mother: row.querySelector("input[data-field='mother']").checked,
      hanging: row.querySelector("input[data-field='hanging']").checked,
      combo: row.querySelector("input[data-field='combo']").checked,
      indoor: row.querySelector("input[data-field='indoor']").checked,
      isRestocked: row.querySelector("input[data-field='isRestocked']").checked,
      placeAva: row.querySelector("select[data-field='placeAva']").value,
      qtyAva: row.querySelector("select[data-field='qtyAva']").value,
      demand: row.querySelector("select[data-field='demand']").value,
    };

    const docRef = doc(db, "plants", data.docId);
    await updateDoc(docRef, updatedData);
  }

  alert("Changes saved for displayed records!");
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("save-all-btn")
    .addEventListener("click", saveChanges);
  document
    .getElementById("next-btn")
    .addEventListener("click", () => fetchData("next"));
  document
    .getElementById("prev-btn")
    .addEventListener("click", () => fetchData("prev"));
  fetchData();
});

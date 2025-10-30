// Data Storage for resources
let resources = JSON.parse(localStorage.getItem("drrms_resources")) || [];

// DOM elements
const resourceForm = document.getElementById("resourceForm");
const resourceTableBody = document.querySelector("#resourceTable tbody");

const availableTableBody = document.querySelector("#availableTable tbody");
const victimRequestForm = document.getElementById("victimRequestForm");

const selectedResIndexInput = document.getElementById("selectedResIndex");
const victimReqTypeInput = document.getElementById("victimReqType");
const victimReqLocationInput = document.getElementById("victimReqLocation");

// For custom resource input on volunteer form
const resTypeSelect = document.getElementById("resType");
const customResTypeDiv = document.getElementById("customResTypeDiv");
const customResTypeInput = document.getElementById("customResType");
const resContactInput = document.getElementById("resContact");

// Bootstrap modal instance
const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'), {});

// Message containers for volunteer and victim forms (created dynamically)
const resourceFormMessage = createMessageBox(resourceForm);
const victimFormMessage = createMessageBox(victimRequestForm);

// Create a message box below the given form for feedback messages
function createMessageBox(form) {
  const div = document.createElement("div");
  div.className = "alert mt-3 visually-hidden"; // initially hidden
  form.appendChild(div);
  return div;
}

// Show feedback message with type: 'success', 'danger', 'warning'
function showMessage(container, message, type = "success") {
  container.textContent = message;
  container.className = `alert alert-${type} mt-3`;
  container.classList.remove("visually-hidden");
  setTimeout(() => {
    container.classList.add("visually-hidden");
  }, 4000);
}

// Save resources to localStorage and update display
function saveAndDisplayResources() {
  localStorage.setItem("drrms_resources", JSON.stringify(resources));
  displayResources();
  loadAvailableResourcesForVictim();
}

// Volunteer: Display all resources added
function displayResources() {
  resourceTableBody.innerHTML = "";
  resources.forEach((res) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${res.type}</td>
      <td>${res.qty}</td>
      <td>${res.location}</td>
      <td>${res.contact}</td>
      <td>${res.timeframe || ""}</td>
      <td>${res.details || ""}</td>
      <td>
        ${res.status === "Available" ? `<span class="badge bg-success">${res.status}</span>` :
          res.status === "In Progress" ? `<span class="badge bg-warning text-dark">${res.status}</span>` :
            `<span class="badge bg-secondary">${res.status}</span>`
        }
      </td>
    `;
    resourceTableBody.appendChild(row);
  });
}

// Volunteer: 'Others' selection handling
resTypeSelect.addEventListener("change", () => {
  if (resTypeSelect.value === "Others") {
    customResTypeDiv.classList.remove("visually-hidden");
    customResTypeInput.setAttribute("required", "required");
  } else {
    customResTypeDiv.classList.add("visually-hidden");
    customResTypeInput.removeAttribute("required");
    customResTypeInput.value = "";
  }
});

// Volunteer: Add new resource form submit handler
resourceForm.addEventListener("submit", (e) => {
  e.preventDefault();

  let type = resTypeSelect.value;
  if (type === "Others") {
    type = customResTypeInput.value.trim();
    if (!type) {
      showMessage(resourceFormMessage, "Please specify your resource/service.", "danger");
      return;
    }
  }

  const qty = document.getElementById("resQty").value.trim();
  const location = document.getElementById("resLocation").value.trim();
  const timeframe = document.getElementById("resTime").value.trim();
  const details = document.getElementById("resDetails").value.trim();
  const contact = resContactInput.value.trim();

  // ✅ Contact validation
  const phonePattern = /^[0-9]{10,15}$/;
  if (!phonePattern.test(contact)) {
    alert("Please enter a valid contact number (10 digits).");
    return;
  }

  if (!type || !qty || !location || !contact) {
    showMessage(resourceFormMessage, "Please fill in all required resource fields including contact.", "danger");
    return;
  }

  resources.push({
    type,
    qty,
    location,
    timeframe,
    details,
    contact,
    status: "Available",
    requests: []
  });

  saveAndDisplayResources();
  resourceForm.reset();
  customResTypeDiv.classList.add("visually-hidden");
  customResTypeInput.removeAttribute("required");
  showMessage(resourceFormMessage, "Resource successfully added!", "success");
});

// Victim: Load and display available resources
function loadAvailableResourcesForVictim() {
  const availableResources = resources.filter(res => res.status === "Available");
  displayAvailableResources(availableResources);
  victimRequestForm.classList.add("visually-hidden");
}

// Victim: Display available resources with "Select" buttons
function displayAvailableResources(list) {
  availableTableBody.innerHTML = "";
  if (list.length === 0) {
    availableTableBody.innerHTML = `<tr><td colspan="7" class="text-center fst-italic">No resources available</td></tr>`;
    return;
  }

  list.forEach((res) => {
    const row = document.createElement("tr");
    row.dataset.index = resources.indexOf(res);
    row.innerHTML = `
      <td>${res.type}</td>
      <td>${res.qty}</td>
      <td>${res.location}</td>
      <td>${res.timeframe || ""}</td>
      <td>${res.details || ""}</td>
      <td>${res.contact || ""}</td>
      <td><button class="btn btn-sm btn-success select-resource-btn">Select</button></td>
    `;
    availableTableBody.appendChild(row);
  });
}

// Victim: Handle "Select" button click on available resources
availableTableBody.addEventListener("click", (e) => {
  if (e.target.classList.contains("select-resource-btn")) {
    const row = e.target.closest("tr");
    const index = parseInt(row.dataset.index, 10);
    if (isNaN(index) || !resources[index]) {
      alert("Selected resource is not available.");
      return;
    }

    const resource = resources[index];
    selectedResIndexInput.value = index;
    victimReqTypeInput.value = resource.type;
    victimReqLocationInput.value = resource.location;

    victimRequestForm.classList.remove("visually-hidden");
    victimRequestForm.scrollIntoView({ behavior: "smooth" });
  }
});

// Victim: Submit request form
victimRequestForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const index = parseInt(selectedResIndexInput.value, 10);
  if (isNaN(index) || !resources[index] || resources[index].status !== "Available") {
    alert("Selected resource is no longer available. Please select another.");
    victimRequestForm.classList.add("visually-hidden");
    loadAvailableResourcesForVictim();
    return;
  }

  const name = document.getElementById("victimReqName").value.trim();
  const urgency = document.getElementById("victimReqUrgency").value;
  const contact = document.getElementById("victimReqContact").value.trim();
  const victimLocation = document.getElementById("victimReqVictimLocation").value.trim();
  const details = document.getElementById("victimReqDetails").value.trim();

  // ✅ Victim contact validation
  const phonePattern = /^[0-9]{10,15}$/;
  if (!phonePattern.test(contact)) {
    alert("Please enter a valid contact number of 10 digits.");
    return;
  }

  if (!name || !urgency || !contact || !victimLocation) {
    showMessage(victimFormMessage, "Please fill all required personal details including location.", "danger");
    return;
  }

  // Update resource request
  resources[index].status = "In Progress";
  resources[index].requests.push({
    name,
    urgency,
    contact,
    victimLocation,
    details,
    requestedAt: new Date().toISOString()
  });

  saveAndDisplayResources();

  // Show bootstrap modal confirmation
  confirmationModal.show();

  victimRequestForm.reset();
  victimRequestForm.classList.add("visually-hidden");
  loadAvailableResourcesForVictim();
});

// Initialize displays on page load
saveAndDisplayResources();

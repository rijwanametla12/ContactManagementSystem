
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@123";

const welcomePanel = document.getElementById("welcomePanel");
const appPanel = document.getElementById("appPanel");
const contactForm = document.getElementById("contactForm");
const contactList = document.getElementById("contactList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("search");
const message = document.getElementById("message");

let currentRole = "";
let editingId = null;
let contacts = loadContacts();

function loadContacts() {
    try {
        const saved = JSON.parse(localStorage.getItem("contactBook") || "[]");

        if (!Array.isArray(saved)) return [];

        return saved.map((contact, index) => ({
            id: contact.id || `contact-${index}-${Date.now()}`,
            name: contact.name || "",
            phone: contact.phone || "",
            email: contact.email || ""
        }));
    } catch {
        return [];
    }
}

function saveContacts() {
    localStorage.setItem("contactBook", JSON.stringify(contacts));
}

function showMessage(text, type = "success") {
    message.textContent = text;
    message.style.color = type === "error" ? "#c53b4b" : "#168568";
}

function goHome() {
    currentRole = "";
    editingId = null;
    welcomePanel.hidden = false;
    appPanel.hidden = true;

    document.getElementById("roleBadge").textContent = "Choose a panel";

    resetForm();
}

document.getElementById("homeLink").addEventListener("click", function(event) {
    event.preventDefault();
    goHome();
});

document.getElementById("adminLogin").addEventListener("click", function() {
    const username = prompt("Enter admin username:");

    if (username === null) return;

    const password = prompt("Enter admin password:");

    if (password === null) return;

    if (username.trim() === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD) {
        openPanel("admin");
    } else {
        alert("Incorrect username or password!");
    }
});

document.getElementById("userLogin").addEventListener("click", function() {
    openPanel("user");
});

function openPanel(role) {
    currentRole = role;
    welcomePanel.hidden = true;
    appPanel.hidden = false;

    const isAdmin = role === "admin";

    document.getElementById("roleBadge").textContent =
        isAdmin ? "Admin Panel" : "User Panel";

    document.getElementById("panelTitle").textContent =
        isAdmin ? "Admin Dashboard" : "User Dashboard";

    document.getElementById("panelDescription").textContent =
        isAdmin
            ? "Manage the complete contact directory."
            : "Manage your contact directory.";

    document.getElementById("currentRole").textContent =
        isAdmin ? "Admin" : "User";

    renderContacts();
}

document.getElementById("logoutBtn").addEventListener("click", goHome);

function resetForm() {
    contactForm.reset();
    editingId = null;

    document.getElementById("formTitle").textContent = "Add new contact";
    document.getElementById("formMode").textContent = "NEW";
    document.getElementById("submitBtn").textContent = "Add contact";
    document.getElementById("cancelBtn").hidden = true;

    message.textContent = "";
}

document.getElementById("cancelBtn").addEventListener("click", resetForm);

contactForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!/^[A-Za-z ]+$/.test(name)) {
        showMessage("Name must contain letters and spaces only.", "error");
        return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
        showMessage("Phone number must contain exactly 10 digits.", "error");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    const duplicate = contacts.find(contact =>
        contact.id !== editingId &&
        (contact.phone === phone ||
        contact.email.toLowerCase() === email.toLowerCase())
    );

    if (duplicate) {
        showMessage("This phone number or email already exists.", "error");
        return;
    }

    if (editingId !== null) {
        contacts = contacts.map(contact =>
            contact.id === editingId
                ? { ...contact, name, phone, email }
                : contact
        );

        showMessage("Contact updated successfully!");
    } else {
        const id = typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random();

        contacts.push({ id, name, phone, email });
        showMessage("Contact added successfully!");
    }

    saveContacts();

    editingId = null;
    contactForm.reset();

    document.getElementById("formTitle").textContent = "Add new contact";
    document.getElementById("formMode").textContent = "NEW";
    document.getElementById("submitBtn").textContent = "Add contact";
    document.getElementById("cancelBtn").hidden = true;

    renderContacts();
});

searchInput.addEventListener("input", renderContacts);

function renderContacts() {
    const query = searchInput.value.trim().toLowerCase();

    const filtered = contacts.filter(contact =>
        contact.name.toLowerCase().includes(query)
    );

    contactList.innerHTML = "";

    document.getElementById("totalContacts").textContent = contacts.length;

    document.getElementById("resultCount").textContent =
        `${filtered.length} contact${filtered.length !== 1 ? "s" : ""}`;

    emptyMessage.hidden = filtered.length > 0;

    filtered.forEach(contact => {
        const row = document.createElement("tr");

        [contact.name, contact.phone, contact.email].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        const deleteButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.className = "text-action";

        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "text-action delete";

        editButton.addEventListener("click", () => editContact(contact.id));
        deleteButton.addEventListener("click", () => deleteContact(contact.id));

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        contactList.appendChild(row);
    });
}

function editContact(id) {
    const contact = contacts.find(item => item.id === id);

    if (!contact) return;

    editingId = id;

    document.getElementById("name").value = contact.name;
    document.getElementById("phone").value = contact.phone;
    document.getElementById("email").value = contact.email;

    document.getElementById("formTitle").textContent = "Update contact";
    document.getElementById("formMode").textContent = "EDIT";
    document.getElementById("submitBtn").textContent = "Update contact";
    document.getElementById("cancelBtn").hidden = false;

    showMessage("Edit the details and click Update contact.");
    document.getElementById("name").focus();
}

function deleteContact(id) {
    const contact = contacts.find(item => item.id === id);

    if (!contact) return;

    if (!confirm(`Are you sure you want to delete ${contact.name}?`)) {
        return;
    }

    contacts = contacts.filter(item => item.id !== id);

    if (editingId === id) {
        resetForm();
    }

    saveContacts();
    renderContacts();
    showMessage("Contact deleted successfully!");
}

document.getElementById("saveBtn").addEventListener("click", function() {
    const blob = new Blob(
        [JSON.stringify(contacts, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "contacts-backup.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderContacts();


// ========================================
// ContactHub - Main JavaScript
// ========================================

// Elements
const contactForm = document.getElementById("contactForm");
const contactModalElement = document.getElementById("contactModal");
const contactModal = new bootstrap.Modal(contactModalElement);

const contactsContainer = document.getElementById("contactsContainer");
const favoritesContainer = document.getElementById("favoritesContainer");
const emergencyContainer = document.getElementById("emergencyContainer");

const searchInput = document.getElementById("searchInput");
const photoInput = document.getElementById("photoInput");
const photoPreview = document.getElementById("photoPreview");

let contacts = JSON.parse(localStorage.getItem("contactHubContacts")) || [];
let currentPhoto = "";

// ========================================
// SweetAlert Helper
// ========================================

function showAlert(icon, title, text) {
    if (typeof Swal !== "undefined") {
        return Swal.fire({
            icon,
            title,
            text,
            confirmButtonColor: "#6c35ff"
        });
    }

    alert(title + (text ? "\n" + text : ""));
    return Promise.resolve();
}

// ========================================
// LocalStorage
// ========================================

function saveContacts() {
    localStorage.setItem("contactHubContacts", JSON.stringify(contacts));
}

// ========================================
// Safe HTML
// ========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function escapeAttribute(value) {
    return escapeHTML(value);
}

// ========================================
// Avatar
// ========================================

function getAvatar(contact) {
    if (contact.photo) {
        return `<img class="contact-avatar"
                    src="${contact.photo}"
                    alt="${escapeAttribute(contact.name)}">`;
    }

    const initial = escapeHTML(contact.name.charAt(0).toUpperCase());

    return `<div class="contact-avatar d-grid place-items-center"
                 style="display:grid;place-items:center;font-size:23px;font-weight:bold;">
                ${initial}
            </div>`;
}

// ========================================
// Open Add Modal
// ========================================

function openAddModal() {
    contactForm.reset();

    document.getElementById("contactId").value = "";
    document.getElementById("modalTitle").textContent = "Add New Contact";

    currentPhoto = "";
    photoPreview.innerHTML = "<span>♟</span>";

    contactModal.show();
}

// ========================================
// Open Edit Modal
// ========================================

function editContact(id) {
    const contact = contacts.find(item => item.id === id);

    if (!contact) return;

    document.getElementById("contactId").value = contact.id;
    document.getElementById("fullName").value = contact.name;
    document.getElementById("phone").value = contact.phone;
    document.getElementById("email").value = contact.email || "";
    document.getElementById("address").value = contact.address || "";
    document.getElementById("notes").value = contact.notes || "";

    document.getElementById("isFavorite").checked = contact.favorite;
    document.getElementById("isEmergency").checked = contact.emergency;

    currentPhoto = contact.photo || "";

    photoPreview.innerHTML = currentPhoto
        ? `<img src="${currentPhoto}" alt="Contact photo">`
        : `<span>♟</span>`;

    document.getElementById("modalTitle").textContent = "Edit Contact";

    contactModal.show();
}

// ========================================
// Upload Photo
// ========================================

photoInput.addEventListener("change", function () {
    const file = this.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        showAlert("error", "Invalid File", "Please select an image.");
        this.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        showAlert("warning", "Image Too Large",
            "Please select an image smaller than 2 MB.");
        this.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        currentPhoto = event.target.result;

        photoPreview.innerHTML =
            `<img src="${currentPhoto}" alt="Preview">`;
    };

    reader.readAsDataURL(file);
});

// ========================================
// Egyptian Phone Validation
// ========================================

function isValidEgyptianPhone(phone) {
    const cleanPhone = phone.replace(/[\s-]/g, "");

    return /^(010|011|012|015)[0-9]{8}$/.test(cleanPhone) ||
           /^\+201(0|1|2|5)[0-9]{8}$/.test(cleanPhone);
}

// ========================================
// Add / Update Contact
// ========================================

contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const id = document.getElementById("contactId").value;

    const name = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const address = document.getElementById("address").value.trim();
    const notes = document.getElementById("notes").value.trim();

    const favorite = document.getElementById("isFavorite").checked;
    const emergency = document.getElementById("isEmergency").checked;

    // Name Validation
    if (name.length < 2) {
        showAlert("warning", "Invalid Name",
            "Please enter a valid full name.");
        return;
    }

    // Phone Validation
    if (!isValidEgyptianPhone(phone)) {
        showAlert(
            "error",
            "Invalid Phone",
            "Please enter a valid Egyptian phone number (e.g., 01012345678 or +201012345678)."
        );
        return;
    }

    // Email Validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert("error", "Invalid Email",
            "Please enter a valid email address.");
        return;
    }

    // Duplicate Phone Validation
    const duplicatePhone = contacts.some(contact =>
        contact.phone.replace(/[\s-]/g, "") === phone.replace(/[\s-]/g, "")
        && contact.id !== id
    );

    if (duplicatePhone) {
        showAlert("warning", "Duplicate Phone",
            "This phone number already exists.");
        return;
    }

    const contactData = {
        id: id || Date.now().toString(),
        name,
        phone,
        email,
        address,
        notes,
        favorite,
        emergency,
        photo: currentPhoto
    };

    if (id) {
        // UPDATE
        contacts = contacts.map(contact =>
            contact.id === id ? contactData : contact
        );

        showAlert("success", "Contact Updated!",
            "Contact information has been updated.");
    } else {
        // CREATE
        contacts.push(contactData);

        showAlert("success", "Contact Added!",
            "Your new contact has been saved successfully.");
    }

    saveContacts();
    renderContacts();

    contactModal.hide();
    contactForm.reset();

    currentPhoto = "";
    photoPreview.innerHTML = "<span>♟</span>";
});

// ========================================
// Delete Contact
// ========================================

function deleteContact(id) {
    const contact = contacts.find(item => item.id === id);

    if (!contact) return;

    const confirmDelete = typeof Swal !== "undefined"
        ? Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete ${contact.name}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e60039",
            cancelButtonColor: "#6c757d",
            confirmButtonText: "Yes, Delete",
            cancelButtonText: "Cancel"
        })
        : Promise.resolve({
            isConfirmed: confirm("Are you sure you want to delete " + contact.name + "?")
        });

    confirmDelete.then(result => {
        if (!result.isConfirmed) return;

        contacts = contacts.filter(item => item.id !== id);

        saveContacts();
        renderContacts();

        showAlert("success", "Deleted!",
            "Contact has been deleted successfully.");
    });
}

// ========================================
// Toggle Favorite
// ========================================

function toggleFavorite(id) {
    contacts = contacts.map(contact => {
        if (contact.id === id) {
            return {
                ...contact,
                favorite: !contact.favorite
            };
        }

        return contact;
    });

    saveContacts();
    renderContacts();
}

// ========================================
// Toggle Emergency
// ========================================

function toggleEmergency(id) {
    contacts = contacts.map(contact => {
        if (contact.id === id) {
            return {
                ...contact,
                emergency: !contact.emergency
            };
        }

        return contact;
    });

    saveContacts();
    renderContacts();
}

// ========================================
// Render Contacts
// ========================================

function renderContacts() {

    const searchValue = searchInput.value.toLowerCase().trim();

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchValue) ||
        contact.phone.toLowerCase().includes(searchValue) ||
        contact.email.toLowerCase().includes(searchValue)
    );

    // Statistics
    document.getElementById("totalCount").textContent = contacts.length;

    document.getElementById("favoriteCount").textContent =
        contacts.filter(contact => contact.favorite).length;

    document.getElementById("emergencyCount").textContent =
        contacts.filter(contact => contact.emergency).length;

    document.getElementById("contactsSubtitle").textContent =
        contacts.length;

    // Main Contacts
    if (filteredContacts.length === 0) {

        contactsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▣</div>
                <h5>${contacts.length === 0
                    ? "No contacts found"
                    : "No matching contacts"}</h5>
                <p>${contacts.length === 0
                    ? 'Click "Add Contact" to get started'
                    : "Try another search term."}</p>
            </div>
        `;

    } else {

        contactsContainer.innerHTML = filteredContacts.map(contact => `

            <div class="contact-card">

                <div class="contact-top">

                    ${getAvatar(contact)}

                    <div class="contact-info">
                        <h5>${escapeHTML(contact.name)}</h5>
                        <small>${escapeHTML(contact.phone)}</small>
                    </div>

                    <button class="star-button ${contact.favorite ? "active" : ""}"
                            onclick="toggleFavorite('${contact.id}')"
                            title="Toggle Favorite">
                        ★
                    </button>

                </div>

                <div class="contact-details">

                    <p>
                        📞
                        <a href="tel:${escapeAttribute(contact.phone)}">
                            ${escapeHTML(contact.phone)}
                        </a>
                    </p>

                    ${contact.email ? `
                        <p>
                            ✉
                            <a href="mailto:${escapeAttribute(contact.email)}">
                                ${escapeHTML(contact.email)}
                            </a>
                        </p>
                    ` : ""}

                    ${contact.address ? `
                        <p>📍 ${escapeHTML(contact.address)}</p>
                    ` : ""}

                    ${contact.notes ? `
                        <p>📝 ${escapeHTML(contact.notes)}</p>
                    ` : ""}

                    <div class="contact-tags">

                        ${contact.favorite
                            ? '<span class="contact-tag">★ Favorite</span>'
                            : ""}

                        ${contact.emergency
                            ? '<span class="contact-tag emergency-tag">♥ Emergency</span>'
                            : ""}

                    </div>

                </div>

                <div class="contact-actions">

                    <div class="action-group">

                        <a class="action-btn d-grid place-items-center text-decoration-none"
                           style="display:grid;place-items:center;"
                           href="tel:${escapeAttribute(contact.phone)}"
                           title="Call">
                            📞
                        </a>

                        ${contact.email ? `
                            <a class="action-btn d-grid place-items-center text-decoration-none"
                               style="display:grid;place-items:center;"
                               href="mailto:${escapeAttribute(contact.email)}"
                               title="Email">
                                ✉
                            </a>
                        ` : ""}

                    </div>

                    <div class="action-group">

                        <button class="action-btn"
                                onclick="toggleEmergency('${contact.id}')"
                                title="Toggle Emergency">
                            ♥
                        </button>

                        <button class="action-btn"
                                onclick="editContact('${contact.id}')"
                                title="Edit">
                            ✎
                        </button>

                        <button class="action-btn delete-btn"
                                onclick="deleteContact('${contact.id}')"
                                title="Delete">
                            🗑
                        </button>

                    </div>

                </div>

            </div>

        `).join("");

    }

    // Favorites Sidebar
    renderSidebar(
        favoritesContainer,
        contacts.filter(contact => contact.favorite),
        "No favorites yet"
    );

    // Emergency Sidebar
    renderSidebar(
        emergencyContainer,
        contacts.filter(contact => contact.emergency),
        "No emergency contacts"
    );
}

// ========================================
// Render Sidebar
// ========================================

function renderSidebar(container, items, emptyMessage) {

    if (items.length === 0) {
        container.innerHTML = `<p>${emptyMessage}</p>`;
        return;
    }

    container.innerHTML = items.map(contact => `

        <div class="side-contact">

            ${contact.photo
                ? `<img src="${contact.photo}" alt="">`
                : `<div class="contact-avatar d-grid"
                        style="width:38px;height:38px;display:grid;place-items:center;border-radius:50%;">
                        ${escapeHTML(contact.name.charAt(0).toUpperCase())}
                   </div>`
            }

            <div>
                <strong>${escapeHTML(contact.name)}</strong>
                <small>${escapeHTML(contact.phone)}</small>
            </div>

            <a href="tel:${escapeAttribute(contact.phone)}"
               class="action-btn d-grid text-decoration-none"
               style="display:grid;place-items:center;">
                📞
            </a>

        </div>

    `).join("");
}

// ========================================
// Search
// ========================================

searchInput.addEventListener("input", renderContacts);

// ========================================
// Initial Render
// ========================================

renderContacts();

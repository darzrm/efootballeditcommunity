'use strict';

/**
 * Element toggle function
 */
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

/**
 * Sidebar variables & toggle (Mobile)
 */
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
}

/**
 * Filter & Custom Select (Hanya jalan jika elemennya ada)
 */
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

if (select) {
  select.addEventListener("click", function () { elementToggleFunc(this); });
}

const filterFunc = function (selectedValue) {
  for (let i = 0; i < filterItems.length; i++) {
    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }
  }
}

for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);
  });
}

if (filterBtn.length > 0) {
  let lastClickedBtn = filterBtn[0];
  for (let i = 0; i < filterBtn.length; i++) {
    filterBtn[i].addEventListener("click", function () {
      let selectedValue = this.innerText.toLowerCase();
      selectValue.innerText = this.innerText;
      filterFunc(selectedValue);
      lastClickedBtn.classList.remove("active");
      this.classList.add("active");
      lastClickedBtn = this;
    });
  }
}

/**
 * Contact Form Validation
 */
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

if (form) {
  for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {
      if (form.checkValidity()) {
        formBtn.removeAttribute("disabled");
      } else {
        formBtn.setAttribute("disabled", "");
      }
    });
  }
}

/**
 * Page Navigation (Perbaikan Utama)
 */
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    // Gunakan innerText dan trim() agar spasi di HTML tidak merusak pencarian
    const clickedPage = this.innerText.toLowerCase().trim();

    for (let j = 0; j < pages.length; j++) {
      if (clickedPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }

  });
}

// --- SUPABASE INITIALIZATION ---
const SUPABASE_URL = 'https://pddlqipctqacvzmoydgy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZGxxaXBjdHFhY3Z6bW95ZGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzEyNjksImV4cCI6MjA5MjAwNzI2OX0.MRq6Z0Njg-w6ALw5lJo7r8Ijn6xRAF-aq6PvJnmuGpw'; // Gunakan key lengkapmu
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * AUTH & NAVIGATION LOGIC
 */
window.addEventListener('click', async function(event) {
  const gCont = document.getElementById('guest-container');
  const aCont = document.getElementById('auth-container');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const userInput = document.getElementById('auth-username');

  // Switch to Auth View
  if (event.target.closest('#btn-start-auth')) {
    gCont.style.setProperty('display', 'none', 'important');
    aCont.style.setProperty('display', 'block', 'important');
  }

  // Switch back to Guest View
  if (event.target.closest('#btn-cancel-auth')) {
    aCont.style.setProperty('display', 'none', 'important');
    gCont.style.setProperty('display', 'block', 'important');
  }

  // LOGIN ACTION
  if (event.target.closest('#login-btn-final')) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    else checkAccountStatus();
  }

  // REGISTER ACTION
  if (event.target.closest('#register-btn-final')) {
    if (!userInput.value) return Swal.fire({ icon: 'warning', text: 'Please enter a username' });
    const { error } = await supabaseClient.auth.signUp({
      email: emailInput.value,
      password: passInput.value,
      options: { data: { display_name: userInput.value } }
    });
    if (error) Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    else Swal.fire({ icon: 'success', text: 'Registration successful! Please login.', background: '#1e1e1f', color: '#fff' });
  }

  // FORGOT PASSWORD ACTION
  if (event.target.closest('#btn-forgot-pass')) {
    if (!emailInput.value) return Swal.fire({ icon: 'info', text: 'Please enter your email first.' });
    const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput.value);
    if (error) Swal.fire({ icon: 'error', text: error.message });
    else Swal.fire({ icon: 'success', text: 'Reset link sent to your email!' });
  }

  // LOGOUT ACTION
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
  
  // UPDATE USERNAME ACTION
  if (event.target.closest('#btn-update-name')) {
    const newName = document.getElementById('new-username').value;
    const { error } = await supabaseClient.auth.updateUser({ data: { display_name: newName } });
    if (error) Swal.fire({ icon: 'error', text: error.message });
    else {
      Swal.fire({ icon: 'success', text: 'Username updated!' });
      checkAccountStatus();
    }
  }
});

/**
 * UI ENGINE: Membersihkan penumpukan tampilan
 */
async function checkAccountStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  // Ambil semua container
  const guest = document.getElementById('guest-container');
  const auth = document.getElementById('auth-container');
  const profile = document.getElementById('profile-container');
  const display = document.getElementById('user-info-display');

  // Fungsi pembantu untuk menyembunyikan semua layar
  const hideAllViews = () => {
    if (guest) guest.style.display = 'none';
    if (auth) auth.style.display = 'none';
    if (profile) profile.style.display = 'none';
  };

  hideAllViews(); // Bersihkan layar dulu

  if (user) {
    // Tampilkan hanya Profile jika sudah login
    if (profile) profile.style.display = 'block';

    const date = new Date(user.created_at).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    display.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet); grid-column: span 2;">
          <h4 class="h4" style="font-size: 22px; color: var(--orange-yellow-crayola); margin-bottom: 2px;">
            ${user.user_metadata.display_name || 'Member'}
          </h4>
          <p style="font-size: 13px; color: var(--light-gray); margin-bottom: 5px;">${user.email}</p>
          <p style="font-size: 11px; color: var(--light-gray-70); border-top: 1px solid var(--jet); pt: 5px; margin-top: 5px;">
            Joined: ${date}
          </p>
        </div>
        
        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
          <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Points</p>
          <p style="font-size: 20px; font-weight: 600; color: #38bdf8;">0</p>
        </div>

        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
          <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Role</p>
          <p style="font-size: 20px; font-weight: 600; color: #fbbf24;">Member</p>
        </div>
      </div>
    `;
  } else {
    // Tampilkan hanya Guest jika belum login
    if (guest) guest.style.display = 'block';
  }
}

/**
 * AUTH EVENT HANDLERS (Fixing Toggle & Overlapping)
 */
window.addEventListener('click', async function(event) {
  const guest = document.getElementById('guest-container');
  const auth = document.getElementById('auth-container');
  const profile = document.getElementById('profile-container');

  // Trigger Get Started (Guest -> Auth)
  if (event.target.closest('#btn-start-auth')) {
    if (guest) guest.style.display = 'none';
    if (auth) auth.style.display = 'block';
  }

  // Trigger Close (Auth -> Guest)
  if (event.target.closest('#btn-cancel-auth')) {
    if (auth) auth.style.display = 'none';
    if (guest) guest.style.display = 'block';
  }

  // LOGIN SUCCESS (Menyembunyikan Auth saat login berhasil)
  if (event.target.closest('#login-btn-final')) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    
    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      // Pastikan semua layar disembunyikan sebelum profil dimunculkan
      if (auth) auth.style.display = 'none';
      checkAccountStatus(); 
    }
  }

  // SHOW/HIDE EDIT USERNAME FORM
  if (event.target.closest('#btn-show-edit')) {
    const editSection = document.getElementById('edit-username-section');
    // Toggle tampilan saja tanpa merusak container utama
    editSection.style.display = editSection.style.display === 'none' ? 'block' : 'none';
  }
});

// Pastikan dipanggil saat awal load
checkAccountStatus();

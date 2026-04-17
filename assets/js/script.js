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

// --- KONFIGURASI SUPABASE ---
const SUPABASE_URL = 'https://pddlqipctqacvzmoydgy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZGxxaXBjdHFhY3Z6bW95ZGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzEyNjksImV4cCI6MjA5MjAwNzI2OX0.MRq6Z0Njg-w6ALw5lJo7r8Ijn6xRAF-aq6PvJnmuGpw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- UTILITY: TOAST NOTIFICATION ---
const showToast = (icon, title) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#1e1e1f',
    color: '#fff',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });
  Toast.fire({ icon, title });
};

// --- CORE LOGIC ---
const btnLogin = document.getElementById('login-btn');
const btnRegister = document.getElementById('register-btn');
const btnLogout = document.getElementById('logout-btn');
const btnUpdateUser = document.getElementById('btn-change-username');

// Login
btnLogin?.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  
  if (error) showToast('error', 'Login Failed: ' + error.message);
  else {
    showToast('success', 'Logged in successfully!');
    setTimeout(() => checkUserStatus(), 1500);
  }
});

// Register
btnRegister?.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value;

  if (!username) return showToast('warning', 'Please enter a username');

  const { data, error } = await supabaseClient.auth.signUp({
    email, password,
    options: { data: { display_name: username } }
  });

  if (error) showToast('error', 'Registration Failed: ' + error.message);
  else showToast('success', 'Registration successful! Please login.');
});

// Change Username
btnUpdateUser?.addEventListener('click', async () => {
  const newName = document.getElementById('new-username').value;
  if (!newName) return showToast('warning', 'Enter a new username first');

  const { data, error } = await supabaseClient.auth.updateUser({
    data: { display_name: newName }
  });

  if (error) showToast('error', 'Update failed: ' + error.message);
  else {
    showToast('success', 'Username updated!');
    checkUserStatus();
  }
});

// Logout
btnLogout?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showToast('info', 'Logged out successfully');
  setTimeout(() => location.reload(), 1500);
});

// Check User & Show Stats
async function checkUserStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const authCont = document.getElementById('auth-container');
  const profCont = document.getElementById('profile-container');
  const userDiv = document.getElementById('user-info');

  if (user) {
    authCont.style.display = 'none';
    profCont.style.display = 'block';

    // Format Date: "Day Month Year, Hour:Minute"
    const joinedDate = new Date(user.created_at);
    const dateString = joinedDate.toLocaleDateString('en-GB', { 
      day: 'numeric', month: 'long', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });

    userDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: var(--light-gray); font-size: 13px;">Welcome back,</p>
        <h4 class="h4" style="color: var(--orange-yellow-crayola); font-size: 24px;">
          ${user.user_metadata.display_name || 'Member'}
        </h4>
        <p style="font-size: 12px; color: var(--light-gray-70);">${user.email}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
          <p style="font-size: 11px; color: var(--light-gray); text-transform: uppercase;">Role</p>
          <p style="font-weight: bold; color: #fbbf24;">Member</p>
        </div>
        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
          <p style="font-size: 11px; color: var(--light-gray); text-transform: uppercase;">Points</p>
          <p style="font-weight: bold; color: #38bdf8;">0</p>
        </div>
      </div>

      <div style="margin-top: 15px; background: var(--onyx); padding: 12px; border-radius: 12px; border: 1px solid var(--jet); font-size: 12px;">
        <p style="color: var(--light-gray);">Account Created:</p>
        <p style="color: #fff;">${dateString}</p>
      </div>
    `;
  }
}
checkUserStatus();

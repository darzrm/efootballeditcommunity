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


// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://pddlqipctqacvzmoydgy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZGxxaXBjdHFhY3Z6bW95ZGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzEyNjksImV4cCI6MjA5MjAwNzI2OX0.MRq6Z0Njg-w6ALw5lJo7r8Ijn6xRAF-aq6PvJnmuGpw'; // Pastikan key benar
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- TOAST NOTIFICATION ---
const showToast = (icon, title) => {
  Swal.fire({
    icon: icon, title: title, toast: true, position: 'top-end',
    showConfirmButton: false, timer: 3000, timerProgressBar: true,
    background: '#1e1e1f', color: '#fff'
  });
};

// DOM Elements
const guestCont = document.getElementById('guest-container');
const authCont = document.getElementById('auth-container');
const profCont = document.getElementById('profile-container');
const userDiv = document.getElementById('user-info');

// Navigation Logic
document.getElementById('show-auth-btn')?.addEventListener('click', () => {
  guestCont.style.display = 'none';
  authCont.style.display = 'block';
});

document.getElementById('back-to-guest')?.addEventListener('click', () => {
  authCont.style.display = 'none';
  guestCont.style.display = 'block';
});

// Login
document.getElementById('login-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) showToast('error', error.message);
  else { showToast('success', 'Successfully logged in!'); checkUserStatus(); }
});

// Register
document.getElementById('register-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const username = document.getElementById('auth-username').value;
  if (!username) return showToast('warning', 'Please enter a username');
  const { error } = await supabaseClient.auth.signUp({ 
    email, password, options: { data: { display_name: username } } 
  });
  if (error) showToast('error', error.message);
  else showToast('success', 'Account created! You can login now.');
});

// Change Username
document.getElementById('btn-change-username')?.addEventListener('click', async () => {
  const newName = document.getElementById('new-username').value;
  if (!newName) return showToast('warning', 'New username is required');
  const { error } = await supabaseClient.auth.updateUser({ data: { display_name: newName } });
  if (error) showToast('error', error.message);
  else {
    showToast('success', 'Username updated successfully!');
    document.getElementById('new-username').value = "";
    checkUserStatus();
  }
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  showToast('info', 'Logged out from eFoodico');
  setTimeout(() => location.reload(), 1000);
});

// UI Sync & Stats
async function checkUserStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (user) {
    guestCont.style.display = 'none';
    authCont.style.display = 'none';
    profCont.style.display = 'block';

    const joinedDate = new Date(user.created_at).toLocaleString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    userDiv.innerHTML = `
      <div style="margin-bottom: 25px;">
        <div style="width: 80px; height: 80px; background: var(--onyx); margin: 0 auto 15px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid var(--orange-yellow-crayola);">
          <ion-icon name="person" style="font-size: 40px; color: var(--orange-yellow-crayola);"></ion-icon>
        </div>
        <h4 class="h4" style="font-size: 26px; color: var(--orange-yellow-crayola);">${user.user_metadata.display_name || 'Member'}</h4>
        <p style="font-size: 14px; color: var(--light-gray);">${user.email}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; border: 1px solid var(--jet);">
          <p style="font-size: 11px; color: var(--light-gray); text-transform: uppercase; letter-spacing: 1px;">Current Points</p>
          <p style="font-size: 20px; font-weight: bold; color: #38bdf8;">0 PTS</p>
        </div>
        <div style="background: rgba(255,255,255,0.03); padding: 15px; border-radius: 15px; border: 1px solid var(--jet);">
          <p style="font-size: 11px; color: var(--light-gray); text-transform: uppercase; letter-spacing: 1px;">Account Role</p>
          <p style="font-size: 20px; font-weight: bold; color: #fbbf24;">MEMBER</p>
        </div>
      </div>

      <div style="background: var(--onyx); padding: 12px; border-radius: 10px; font-size: 12px; color: var(--light-gray);">
        Joined Since: <span style="color: #fff; margin-left: 5px;">${joinedDate}</span>
      </div>
    `;
  } else {
    guestCont.style.display = 'block';
    authCont.style.display = 'none';
    profCont.style.display = 'none';
  }
}

checkUserStatus();

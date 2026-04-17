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
const SUPABASE_URL = 'https://URL_PROJECT_ANDA.supabase.co';
const SUPABASE_KEY = 'KEY_ANON_ANDA';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- SELEKTOR ELEMEN ---
const authContainer = document.getElementById('auth-container');
const profileContainer = document.getElementById('profile-container');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authBtn = document.getElementById('auth-btn');
const toggleLink = document.getElementById('toggle-link');
const toggleText = document.getElementById('toggle-text');
const userInfo = document.getElementById('user-info');
const logoutBtn = document.getElementById('logout-btn');

let isLoginMode = true;

// 1. Fungsi Cek Status Login
async function checkUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user) {
    authContainer.style.display = 'none';
    profileContainer.style.display = 'block';
    userInfo.innerHTML = `
      <p>Email: <span style="color: var(--orange-yellow-crayola)">${user.email}</span></p>
      <p>Status: <span style="color: var(--orange-yellow-crayola)">Logged In</span></p>
    `;
  } else {
    authContainer.style.display = 'block';
    profileContainer.style.display = 'none';
  }
}
checkUser();

// 2. Toggle Login/Register
toggleLink.addEventListener('click', () => {
  isLoginMode = !isLoginMode;
  authTitle.innerText = isLoginMode ? 'Login' : 'Daftar Akun';
  authBtn.innerHTML = isLoginMode ? '<ion-icon name="log-in-outline"></ion-icon><span>Login</span>' : '<ion-icon name="person-add-outline"></ion-icon><span>Daftar</span>';
  toggleText.innerText = isLoginMode ? 'Belum punya akun?' : 'Sudah punya akun?';
  toggleLink.innerText = isLoginMode ? 'Daftar di sini' : 'Login di sini';
});

// 3. Handle Submit (Login & Register)
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  if (isLoginMode) {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) alert("Gagal Login: " + error.message);
    else {
      alert("Berhasil Login!");
      checkUser();
    }
  } else {
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) alert("Gagal Daftar: " + error.message);
    else alert("Pendaftaran berhasil! Silakan cek email atau langsung login.");
  }
});

// 4. Handle Logout
logoutBtn.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  alert("Berhasil Logout!");
  checkUser();
});

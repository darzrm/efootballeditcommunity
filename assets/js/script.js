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

// Ambil elemen
const btnLogin = document.getElementById('login-btn');
const btnRegister = document.getElementById('register-btn');
const btnReset = document.getElementById('reset-password-link');
const inputEmail = document.getElementById('auth-email');
const inputPass = document.getElementById('auth-password');

// Fungsi Login
btnLogin.addEventListener('click', async () => {
  const email = inputEmail.value;
  const password = inputPass.value;
  
  if(!email || !password) return alert("Isi email dan password!");

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert("Error: " + error.message);
  else {
    alert("Login Berhasil!");
    location.reload(); // Refresh untuk update status login
  }
});

// Fungsi Register
btnRegister.addEventListener('click', async () => {
  const email = inputEmail.value;
  const password = inputPass.value;

  if(!email || !password) return alert("Isi email dan password!");

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) alert("Error: " + error.message);
  else alert("Registrasi berhasil! Cek email (jika konfirmasi aktif) atau silakan login.");
});

// Fungsi Reset Password
btnReset.addEventListener('click', async () => {
  const email = inputEmail.value;
  if(!email) return alert("Masukkan email kamu terlebih dahulu di kotak input!");

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
  if (error) alert("Error: " + error.message);
  else alert("Link reset password telah dikirim ke email kamu!");
});

// Update Fungsi CheckUser agar lebih akurat
async function checkUserStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const authCont = document.getElementById('auth-container');
  const profCont = document.getElementById('profile-container');
  const userDiv = document.getElementById('user-info');
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  alert("Keluar berhasil!");
  location.reload();
});

  if (user) {
    authCont.style.display = 'none';
    profCont.style.display = 'block';
    userDiv.innerHTML = `
      <p style="color: var(--light-gray)">Halo,</p>
      <p style="font-weight: bold; color: var(--orange-yellow-crayola); font-size: 18px;">${user.email}</p>
      <p style="margin-top:10px; font-size: 14px;">Kamu sudah terdaftar di komunitas.</p>
    `;
  }
}
checkUserStatus();

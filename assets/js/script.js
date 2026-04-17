'use strict';

// toggle function
const elementToggleFunc = function (elem) { 
  elem.classList.toggle("active"); 
}

// sidebar
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { 
    elementToggleFunc(sidebar); 
  });
}

// testimonials modal (biarin, ga ganggu gallery)
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

testimonialsItem.forEach(item => {
  item.addEventListener("click", function () {
    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;
    testimonialsModalFunc();
  });
});

if (modalCloseBtn) modalCloseBtn.addEventListener("click", testimonialsModalFunc);
if (overlay) overlay.addEventListener("click", testimonialsModalFunc);

// navigation
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navigationLinks.forEach((link, index) => {
  link.addEventListener("click", function () {
    pages.forEach((page, i) => {
      if (this.innerHTML.toLowerCase() === page.dataset.page) {
        page.classList.add("active");
        navigationLinks[i].classList.add("active");
      } else {
        page.classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    });
    window.scrollTo(0, 0);
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const rows = document.querySelectorAll("#myTable tbody tr");

  rows.forEach((row, index) => {
    row.children[0].textContent = index + 1;
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const table = document.querySelector("#myTable tbody");
  const rows = Array.from(table.querySelectorAll("tr"));

  // 🔥 sort otomatis (terbesar ke kecil)
  rows.sort((a, b) => {
    const aVal = parseInt(a.children[2].textContent);
    const bVal = parseInt(b.children[2].textContent);
    return bVal - aVal;
  });

  // 🔄 render ulang + kasih nomor
  table.innerHTML = "";
  rows.forEach((row, index) => {
    row.children[0].textContent = index + 1;
    table.appendChild(row);
  });
});

// Konfigurasi Supabase
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// Elemen UI
const btnAuth = document.querySelector("#btn-auth");
const userStatus = document.querySelector("#user-status");
const commentForm = document.querySelector("#comment-form");
const commentDisplay = document.querySelector("#comment-display");

// Ambil Komentar
async function loadComments() {
  const { data } = await _supabase.from('comments').select('*').order('created_at', { ascending: false });
  if (data) {
    commentDisplay.innerHTML = data.map(c => `
      <div class="comment-card">
        <p class="comment-user">User ${c.user_id.substring(0, 5)}</p>
        <p class="comment-date">${new Date(c.created_at).toLocaleDateString()}</p>
        <p class="blog-text">${c.content}</p>
      </div>
    `).join('');
  }
}

// Cek Login & Handle Auth
async function checkUser() {
  const { data: { session } } = await _supabase.auth.getSession();
  if (session) {
    userStatus.innerText = session.user.email.split('@')[0];
    btnAuth.innerHTML = '<span>Logout</span>';
    commentForm.style.display = "block";
    document.querySelector("#login-warn").style.display = "none";
  }
}

btnAuth.addEventListener("click", async () => {
  const { data: { session } } = await _supabase.auth.getSession();
  if (session) { await _supabase.auth.signOut(); location.reload(); } 
  else {
    const email = prompt("Email:");
    const pass = prompt("Password:");
    if (email && pass) {
      const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
      if (error) await _supabase.auth.signUp({ email, password: pass });
      location.reload();
    }
  }
});

// Kirim Komen
commentForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const { data: { session } } = await _supabase.auth.getSession();
  const input = document.querySelector("#comment-input");
  await _supabase.from('comments').insert([{ content: input.value, user_id: session.user.id }]);
  input.value = "";
  loadComments();
});

// Jalankan
document.addEventListener("DOMContentLoaded", () => {
  checkUser();
  loadComments();
});

/**
 * LOGIKA SWITCH TAMPILAN BLOG
 */

function openBlog(blogId) {
  // 1. Sembunyikan daftar blog, tampilkan detail
  document.getElementById('blog-list-container').style.display = 'none';
  document.getElementById('blog-detail-container').style.display = 'block';

  // 2. Isi konten detail (Contoh untuk hello-eec)
  const detailContainer = document.getElementById('blog-content-detail');
  if(blogId === 'hello-eec') {
    detailContainer.innerHTML = `
      <figure class="blog-banner-box" style="margin-bottom: 20px;">
        <img src="./assets/images/g1.jpg" style="width: 100%; border-radius: 16px;">
      </figure>
      <h3 class="h3 blog-item-title" style="margin-bottom: 10px;">Hello from EEC</h3>
      <p class="blog-text" style="color: var(--light-gray);">
        Pada hari ini, komunitas EEC resmi dibentuk sebagai awal dari perjalanan kreatif untuk saling menginspirasi dan tumbuh bersama. Kami percaya bahwa setiap kreator memiliki potensi besar.
      </p>
    `;
  }

  // 3. Load komentar dari Supabase untuk blog ini
  loadComments(blogId);
}

function closeBlog() {
  // Balikkan tampilan
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail-container').style.display = 'none';
}

// Modifikasi fungsi loadComments agar menerima blogId
async function loadComments(blogId = 'hello-eec') {
  const { data, error } = await _supabase
    .from('comments')
    .select('*')
    .eq('blog_id', blogId) // Hanya ambil komen untuk blog ini
    .order('created_at', { ascending: false });

  const display = document.getElementById('comment-display');
  if (data) {
    display.innerHTML = data.length ? data.map(c => `
      <div class="comment-card">
        <p class="comment-user">User ${c.user_id.substring(0, 5)}</p>
        <p class="comment-date">${new Date(c.created_at).toLocaleString()}</p>
        <p class="blog-text">${c.content}</p>
      </div>
    `).join('') : '<p class="blog-text">Belum ada komentar.</p>';
  }
}

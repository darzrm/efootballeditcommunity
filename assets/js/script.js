'use strict';

/**
 * 1. FUNGSI DASAR & UI (NAVIGASI, SIDEBAR, TABEL)
 */
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
}

// Navigation & Pages
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

/**
 * 2. KONFIGURASI SUPABASE
 */
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * 3. FUNGSI BACKEND (LOGIN & KOMENTAR)
 */

async function loadComments(blogId = 'hello-eec') {
  const display = document.getElementById('comment-display');
  if (!display) return;

  const { data, error } = await _supabase
    .from('comments')
    .select('*')
    .eq('blog_id', blogId)
    .order('created_at', { ascending: false });

  if (data) {
    display.innerHTML = data.length ? data.map(c => `
      <div class="comment-card">
        <p class="comment-user">User ${c.user_id.substring(0, 5)}</p>
        <p class="comment-date">${new Date(c.created_at).toLocaleString('id-ID')}</p>
        <p class="blog-text">${c.content}</p>
      </div>
    `).join('') : '<p class="blog-text">Belum ada komentar.</p>';
  }
}

async function checkUser() {
  const btnAuth = document.querySelector("#btn-auth");
  const userStatus = document.querySelector("#user-status");
  const commentForm = document.querySelector("#comment-form");
  const loginWarn = document.querySelector("#login-warn");

  const { data: { session } } = await _supabase.auth.getSession();
  
  if (session && btnAuth) {
    userStatus.innerText = session.user.email.split('@')[0];
    btnAuth.innerHTML = '<ion-icon name="log-out-outline"></ion-icon><span>Logout</span>';
    if (commentForm) commentForm.style.display = "block";
    if (loginWarn) loginWarn.style.display = "none";
    return session.user;
  }
  return null;
}

/**
 * 4. LOGIKA SWITCH BLOG (DIPANGGIL DARI HTML)
 */
window.openBlog = function(blogId) {
  const list = document.getElementById('blog-list-container');
  const detail = document.getElementById('blog-detail-container');
  
  if (list && detail) {
    list.style.display = 'none';
    detail.style.display = 'block';

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
    loadComments(blogId);
  }
}

window.closeBlog = function() {
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail-container').style.display = 'none';
}

/**
 * 5. INISIALISASI SAAT HALAMAN DIBUKA (DOM READY)
 */
document.addEventListener("DOMContentLoaded", () => {
  // Sort Tabel Otomatis
  const table = document.querySelector("#myTable tbody");
  if (table) {
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.sort((a, b) => {
      const aVal = parseInt(a.children[2].textContent) || 0;
      const bVal = parseInt(b.children[2].textContent) || 0;
      return bVal - aVal;
    });
    table.innerHTML = "";
    rows.forEach((row, index) => {
      row.children[0].textContent = index + 1;
      table.appendChild(row);
    });
  }

  // Jalankan Cek User
  checkUser();

  // Event Listener Tombol Auth
  const btnAuth = document.querySelector("#btn-auth");
  if (btnAuth) {
    btnAuth.addEventListener("click", async () => {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) {
        await _supabase.auth.signOut();
        location.reload();
      } else {
        const email = prompt("Email:");
        const pass = prompt("Password (min. 6 karakter):");
        if (email && pass) {
          const { error: loginErr } = await _supabase.auth.signInWithPassword({ email, password: pass });
          if (loginErr) {
            const { error: signUpErr } = await _supabase.auth.signUp({ email, password: pass });
            if (signUpErr) alert(signUpErr.message);
            else alert("Daftar berhasil! Cek email (jika konfirmasi aktif) atau silakan login.");
          }
          location.reload();
        }
      }
    });
  }

  // Event Listener Form Komentar
  const commentForm = document.querySelector("#comment-form");
  if (commentForm) {
    commentForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { data: { session } } = await _supabase.auth.getSession();
      const input = document.querySelector("#comment-input");
      
      if (!session) {
        alert("Silakan login dulu!");
        return;
      }

      const { error } = await _supabase.from('comments').insert([
        { 
          content: input.value, 
          user_id: session.user.id,
          blog_id: 'hello-eec' // Sesuaikan jika ada banyak blog
        }
      ]);

      if (!error) {
        input.value = "";
        loadComments('hello-eec');
      } else {
        alert("Gagal kirim: " + error.message);
      }
    });
  }
});

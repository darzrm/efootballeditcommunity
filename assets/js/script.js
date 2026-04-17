'use strict';

/**
 * 1. CONFIG SUPABASE
 * Pastikan URL dan KEY ini sesuai dengan Dashboard Supabase-mu
 */
const SUPABASE_URL = 'https://edqrjrqdhaolfoehbaow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcXJqcnFkaGFvbGZvZWhiYW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjM1NTEsImV4cCI6MjA5MTk5OTU1MX0.02MISDYOGcf6DFy8ZPzgHkA_N4zglPFUi1b_FN15ueY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let userProfile = null;

/**
 * 2. SIDEBAR TOGGLE (MOBILE)
 */
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
}

/**
 * 3. NAVIGATION & PAGE CONTROL
 */
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const targetPage = this.getAttribute("data-nav-link").toLowerCase().trim();

    pages.forEach((page, index) => {
      if (targetPage === page.dataset.page) {
        page.classList.add("active");
        navigationLinks[index].classList.add("active");
        window.scrollTo(0, 0);
        
        // Panggil data otomatis saat pindah halaman
        if (targetPage === 'event') loadLeaderboard();
        if (targetPage === 'blog') loadPosts();
        if (targetPage === 'account') checkSession();
      } else {
        page.classList.remove("active");
        navigationLinks[index].classList.remove("active");
      }
    });
  });
}

/**
 * 4. LEADERBOARD SYSTEM (Halaman Event)
 */
async function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;

  const { data: profiles, error } = await supabaseClient
    .from('profiles')
    .select('*')
    .order('points', { ascending: false });

  if (error) return console.error("Error loading leaderboard:", error);

  tbody.innerHTML = profiles.map((p, index) => `
    <tr>
      <td>#${index + 1}</td>
      <td>${p.username}</td>
      <td>${p.points} pts</td>
      <td>
        ${userProfile?.role === 'admin' ? 
          `<button class="form-btn" style="padding: 5px 10px;" onclick="addPoints('${p.id}', ${p.points})">+</button>` 
          : (p.role === 'admin' ? '⭐ Admin' : 'Member')}
      </td>
    </tr>
  `).join('');
}

window.addPoints = async (id, currentPoints) => {
  const { error } = await supabaseClient.from('profiles').update({ points: currentPoints + 10 }).eq('id', id);
  if (!error) loadLeaderboard();
};

/**
 * 5. BLOG & NEWS SYSTEM
 */
async function loadPosts() {
  const container = document.getElementById('posts-list');
  if (!container) return;

  const { data: posts, error } = await supabaseClient
    .from('news_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error("Error loading posts:", error);

  // Munculkan list blog
  container.innerHTML = posts.map(post => `
    <li class="blog-post-item" onclick="openPostDetail(${post.id})">
      <div class="blog-content">
        <h3 class="h3 blog-item-title">${post.title}</h3>
        <p class="blog-text">${post.content.substring(0, 80)}...</p>
      </div>
    </li>
  `).join('');
}

window.openPostDetail = async (id) => {
  const { data: post } = await supabaseClient.from('news_posts').select('*').eq('id', id).single();
  
  // Sembunyikan list, tampilkan detail
  document.getElementById('blog-list-container').style.display = 'none';
  const detailView = document.getElementById('blog-detail');
  detailView.style.display = 'block';

  document.getElementById('post-full-content').innerHTML = `
    <h2 class="h2 article-title">${post.title}</h2>
    <p class="about-text" style="color: var(--white-2); margin-bottom: 20px;">${post.content}</p>
  `;
  
  loadComments(id);

  // Pasang event klik kembali
  document.getElementById('back-to-blog').onclick = () => {
    detailView.style.display = 'none';
    document.getElementById('blog-list-container').style.display = 'block';
  };
  
  // Pasang event kirim komentar
  document.getElementById('submit-comment').onclick = () => sendComment(id);
};

async function loadComments(postId) {
  const { data: comments } = await supabaseClient
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  const container = document.getElementById('wa-comments-container');
  container.innerHTML = comments.map(c => `
    <div class="wa-bubble" style="background: var(--onyx); padding: 12px; border-radius: 12px; margin-bottom: 10px; border-left: 3px solid var(--orange-yellow-crayola);">
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px;">
        <b style="color: var(--orange-yellow-crayola)">${c.username}</b>
        <span style="color: var(--light-gray-70)">${c.email}</span>
      </div>
      <p style="color: var(--white-2)">${c.content}</p>
      <div style="text-align: right; font-size: 9px; color: var(--light-gray-70); margin-top: 5px;">
        ${new Date(c.created_at).toLocaleString('id-ID')}
      </div>
    </div>
  `).join('');
}

async function sendComment(postId) {
  if (!currentUser) return alert("Silakan login di menu Account terlebih dahulu!");
  const input = document.getElementById('comment-input');
  if (!input.value.trim()) return;

  await supabaseClient.from('comments').insert([
    { 
      post_id: postId, 
      user_id: currentUser.id, 
      username: userProfile.username, 
      email: currentUser.email,
      content: input.value 
    }
  ]);
  
  input.value = '';
  loadComments(postId);
}

/**
 * 6. ACCOUNT & AUTH SYSTEM
 */
async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const authUI = document.getElementById('auth-ui');
  const profileUI = document.getElementById('profile-ui');

  if (session) {
    currentUser = session.user;
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', currentUser.id).single();
    userProfile = profile;
    
    authUI.style.display = 'none';
    profileUI.style.display = 'block';
    
    document.getElementById('user-name').innerText = profile.username;
    document.getElementById('user-role').innerText = profile.role;
    document.getElementById('user-points').innerText = profile.points;
    document.getElementById('user-join').innerText = new Date(profile.joined_at).toLocaleDateString('id-ID');
  } else {
    authUI.style.display = 'block';
    profileUI.style.display = 'none';
  }
}

// Handler Login
document.getElementById('login-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login Gagal: " + error.message);
  } else {
    checkSession(); // Refresh tampilan
  }
});

// Handler Logout
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

// Cek sesi saat website pertama kali dibuka
checkSession();

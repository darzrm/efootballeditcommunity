'use strict';

// CONFIG SUPABASE
const SUPABASE_URL = 'https://edqrjrqdhaolfoehbaow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcXJqcnFkaGFvbGZvZWhiYW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjM1NTEsImV4cCI6MjA5MTk5OTU1MX0.02MISDYOGcf6DFy8ZPzgHkA_N4zglPFUi1b_FN15ueY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let userProfile = null;

// Element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// Sidebar toggle (Mobile)
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
}

// NAVIGATION LOGIC (Fix Bug)
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    // Ambil target dari data-nav-link, bukan innerText
    const targetPage = this.getAttribute("data-nav-link").toLowerCase();

    for (let j = 0; j < pages.length; j++) {
      if (targetPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
        
        // Load data otomatis
        if (targetPage === 'event') loadLeaderboard();
        if (targetPage === 'blog') loadPosts();
        if (targetPage === 'account') checkSession();
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
  });
}

// LEADERBOARD
async function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;
  const { data: profiles } = await supabaseClient.from('profiles').select('*').order('points', { ascending: false });
  tbody.innerHTML = profiles.map((p, index) => `
    <tr>
      <td>#${index + 1}</td>
      <td>${p.username}</td>
      <td>${p.points} pts</td>
      <td>${userProfile?.role === 'admin' ? `<button class="form-btn" onclick="addPoints('${p.id}', ${p.points})">+</button>` : (p.role === 'admin' ? '⭐' : 'Member')}</td>
    </tr>
  `).join('');
}

window.addPoints = async (id, current) => {
  await supabaseClient.from('profiles').update({ points: current + 10 }).eq('id', id);
  loadLeaderboard();
};

// BLOG SYSTEM
async function loadPosts() {
  const container = document.getElementById('posts-list');
  if (!container) return;
  const { data: posts } = await supabaseClient.from('news_posts').select('*').order('created_at', { ascending: false });
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
  document.getElementById('blog-list-container').style.display = 'none';
  const detailView = document.getElementById('blog-detail');
  detailView.style.display = 'block';
  document.getElementById('post-full-content').innerHTML = `<h2 class="h2 article-title">${post.title}</h2><p class="about-text">${post.content}</p>`;
  loadComments(id);
  document.getElementById('submit-comment').onclick = () => sendComment(id);
};

async function loadComments(postId) {
  const { data: comments } = await supabaseClient.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false });
  const container = document.getElementById('wa-comments-container');
  container.innerHTML = comments.map(c => `
    <div class="wa-bubble" style="background: var(--onyx); padding: 12px; border-radius: 12px; margin-bottom: 10px; border-left: 3px solid var(--orange-yellow-crayola);">
      <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;">
        <b style="color: var(--orange-yellow-crayola)">${c.username}</b>
        <span style="color: var(--light-gray-70)">${c.email}</span>
      </div>
      <p style="color: var(--white-2)">${c.content}</p>
      <div style="text-align:right; font-size:9px; color: var(--light-gray-70); margin-top:5px;">${new Date(c.created_at).toLocaleString()}</div>
    </div>
  `).join('');
}

async function sendComment(postId) {
  if (!currentUser) return alert("Login dulu!");
  const input = document.getElementById('comment-input');
  if (!input.value) return;
  await supabaseClient.from('comments').insert([{ post_id: postId, user_id: currentUser.id, username: userProfile.username, email: currentUser.email, content: input.value }]);
  input.value = '';
  loadComments(postId);
}

// ACCOUNT & AUTH
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
    document.getElementById('user-join').innerText = new Date(profile.joined_at).toLocaleDateString();
  } else {
    authUI.style.display = 'block';
    profileUI.style.display = 'none';
  }
}

document.getElementById('login-btn')?.addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert(error.message); else checkSession();
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

checkSession();

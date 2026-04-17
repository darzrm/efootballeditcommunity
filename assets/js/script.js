'use strict';

/**
 * CONFIG SUPABASE
 */
const SUPABASE_URL = 'URL_PROYEK_KAMU';
const SUPABASE_KEY = 'ANON_KEY_KAMU';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let userProfile = null;

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
 * Page Navigation & Data Loader
 */
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const clickedPage = this.innerText.toLowerCase().trim();

    for (let j = 0; j < pages.length; j++) {
      if (clickedPage === pages[j].dataset.page) {
        pages[j].classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
        
        // Trigger fungsi muat data berdasarkan halaman
        if (clickedPage === 'event') loadLeaderboard();
        if (clickedPage === 'blog') loadPosts();
        if (clickedPage === 'account') checkSession();
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
  });
}

/**
 * LEADERBOARD SYSTEM (Event Page)
 */
async function loadLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  if (!tbody) return;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('points', { ascending: false });

  if (error) return console.error(error);

  tbody.innerHTML = profiles.map((p, index) => `
    <tr>
      <td>#${index + 1}</td>
      <td>${p.username}</td>
      <td>${p.points} <span>pts</span></td>
      <td>
        ${userProfile?.role === 'admin' ? 
          `<button class="form-btn" style="padding: 5px 10px;" onclick="addPoints('${p.id}', ${p.points})">+</button>` 
          : (p.role === 'admin' ? '⭐' : 'Member')}
      </td>
    </tr>
  `).join('');
}

window.addPoints = async (id, currentPoints) => {
  await supabase.from('profiles').update({ points: currentPoints + 10 }).eq('id', id);
  loadLeaderboard();
};

/**
 * BLOG & COMMENT SYSTEM (News)
 */
async function loadPosts() {
  const container = document.getElementById('posts-list');
  if (!container) return;

  const { data: posts } = await supabase.from('news_posts').select('*').order('created_at', { ascending: false });

  container.innerHTML = posts.map(post => `
    <li class="blog-post-item" onclick="openPostDetail(${post.id})">
      <div class="blog-content">
        <div class="blog-meta">
          <p class="blog-category">News</p>
          <span class="dot"></span>
          <time>${new Date(post.created_at).toLocaleDateString()}</time>
        </div>
        <h3 class="h3 blog-item-title">${post.title}</h3>
        <p class="blog-text">${post.content.substring(0, 80)}...</p>
      </div>
    </li>
  `).join('');
}

window.openPostDetail = async (id) => {
  const { data: post } = await supabase.from('news_posts').select('*').eq('id', id).single();
  
  document.getElementById('blog-list-container').style.display = 'none';
  const detailView = document.getElementById('blog-detail');
  detailView.style.display = 'block';

  document.getElementById('post-full-content').innerHTML = `
    <h2 class="h2 article-title">${post.title}</h2>
    <p class="about-text" style="color: var(--white-2); margin-bottom: 20px;">${post.content}</p>
  `;
  
  loadComments(id);
  
  // Setup tombol kirim komen
  document.getElementById('submit-comment').onclick = () => sendComment(id);
};

async function loadComments(postId) {
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  const container = document.getElementById('wa-comments-container');
  container.innerHTML = comments.map(c => {
    const d = new Date(c.created_at);
    const time = `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${d.getMinutes()}`;
    return `
      <div class="wa-bubble">
        <div style="display: flex; justify-content: space-between;">
          <span class="wa-name">${c.username}</span>
          <span style="font-size: 10px; color: var(--light-gray-70);">${c.email}</span>
        </div>
        <p style="color: var(--white-2); margin: 5px 0;">${c.content}</p>
        <span class="wa-time">${time}</span>
      </div>
    `;
  }).join('');
}

async function sendComment(postId) {
  if (!currentUser) return alert("Silahkan login dulu!");
  const text = document.getElementById('comment-input').value;
  if (!text) return;

  await supabase.from('comments').insert([
    { 
      post_id: postId, 
      user_id: currentUser.id, 
      username: userProfile.username, 
      email: currentUser.email,
      content: text 
    }
  ]);
  
  document.getElementById('comment-input').value = '';
  loadComments(postId);
}

/**
 * ACCOUNT SYSTEM (Auth & Stats)
 */
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  const authUI = document.getElementById('auth-ui');
  const profileUI = document.getElementById('profile-ui');

  if (session) {
    currentUser = session.user;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
    userProfile = profile;
    
    authUI.style.display = 'none';
    profileUI.style.display = 'block';
    
    document.getElementById('user-name').innerText = profile.username;
    document.getElementById('user-role').innerText = profile.role;
    document.getElementById('user-points').innerText = profile.points;
    document.getElementById('user-join').innerText = new Date(profile.joined_at).toLocaleString('id-ID');
  } else {
    authUI.style.display = 'block';
    profileUI.style.display = 'none';
  }
}

// Handler Login & Register (Sederhana)
if (document.getElementById('login-btn')) {
  document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message); else checkSession();
  };
}

if (document.getElementById('logout-btn')) {
  document.getElementById('logout-btn').onclick = async () => {
    await supabase.auth.signOut();
    location.reload();
  };
}

// Inisialisasi awal
checkSession();

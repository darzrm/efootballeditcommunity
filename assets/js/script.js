'use strict';

// 1. KONEKSI SUPABASE
const SUPABASE_URL = 'https://edqrjrqdhaolfoehbaow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcXJqcnFkaGFvbGZvZWhiYW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjM1NTEsImV4cCI6MjA5MTk5OTU1MX0.02MISDYOGcf6DFy8ZPzgHkA_N4zglPFUi1b_FN15ueY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. NAVIGASI HALAMAN
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const target = this.getAttribute("data-nav-link").toLowerCase().trim();
    pages.forEach((page, index) => {
      if (target === page.dataset.page) {
        page.classList.add("active");
        navigationLinks[index].classList.add("active");
        if (target === 'blog') loadBlogPosts();
        if (target === 'account') checkUserSession();
      } else {
        page.classList.remove("active");
        navigationLinks[index].classList.remove("active");
      }
    });
  });
}

// 3. BLOG & KOMENTAR
async function loadBlogPosts() {
  const list = document.getElementById('posts-list');
  const { data: posts, error } = await supabaseClient.from('news_posts').select('*').order('created_at', { ascending: false });
  
  if (error) return console.error(error);

  list.innerHTML = posts.map(post => `
    <li class="blog-post-item" onclick="openBlogDetail(${post.id})">
      <a href="javascript:void(0)">
        <figure class="blog-banner-box">
          <img src="./assets/images/b1.jpg" alt="${post.title}">
        </figure>
        <div class="blog-content">
          <div class="blog-meta">
            <p class="blog-category" style="color: #ffffff;">News</p>
            <span class="dot"></span>
            <time style="color: #ffffff;">${new Date(post.created_at).toLocaleDateString()}</time>
          </div>
          <h3 class="h3 blog-item-title" style="color: #ffffff;">${post.title}</h3>
          <p class="blog-text" style="color: #ffffff; opacity: 0.7;">${post.content.substring(0, 100)}...</p>
        </div>
      </a>
    </li>
  `).join('');
}

window.openBlogDetail = async (id) => {
  const { data: post } = await supabaseClient.from('news_posts').select('*').eq('id', id).single();
  
  document.getElementById('blog-list-container').style.display = 'none';
  document.getElementById('blog-detail').style.display = 'block';
  
  document.getElementById('post-full-content').innerHTML = `
    <h2 class="h2 article-title" style="color: #ffffff; margin-bottom: 15px;">${post.title}</h2>
    <p style="white-space: pre-wrap; line-height: 1.6;">${post.content}</p>
  `;

  loadComments(id);
  document.getElementById('submit-comment').onclick = () => sendComment(id);
};

document.getElementById('back-to-blog').onclick = () => {
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail').style.display = 'none';
};

async function loadComments(postId) {
  const { data: comments } = await supabaseClient.from('comments').select('*').eq('post_id', postId).order('created_at', { ascending: false });
  const container = document.getElementById('comments-display-container');
  
  container.innerHTML = comments.map(c => `
    <div style="background: var(--onyx); padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #ffffff;">
      <p style="color: #ffffff; font-weight: 600;">${c.username} <small style="opacity:0.5;">- ${c.email}</small></p>
      <p style="color: #ffffff; margin-top: 5px;">${c.content}</p>
    </div>
  `).join('');
}

async function sendComment(postId) {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) return alert("Login dulu di menu Account!");
  
  const text = document.getElementById('comment-input').value;
  if (!text.trim()) return;

  const { data: profile } = await supabaseClient.from('profiles').select('username').eq('id', session.user.id).single();

  await supabaseClient.from('comments').insert([{
    post_id: postId, user_id: session.user.id, username: profile.username, email: session.user.email, content: text
  }]);

  document.getElementById('comment-input').value = '';
  loadComments(postId);
}

// 4. AUTH (LOGIN & REGISTER)
async function checkUserSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  const authUI = document.getElementById('auth-ui');
  const profileUI = document.getElementById('profile-ui');

  if (session) {
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
    authUI.style.display = 'none';
    profileUI.style.display = 'block';
    document.getElementById('display-email').innerText = session.user.email;
    document.getElementById('display-username').innerText = profile?.username || "User";
    document.getElementById('display-points').innerText = profile?.points || 0;
  } else {
    authUI.style.display = 'block';
    profileUI.style.display = 'none';
  }
}

document.getElementById('btn-register')?.addEventListener('click', async () => {
  const email = document.getElementById('acc-email').value;
  const password = document.getElementById('acc-password').value;
  const username = prompt("Masukkan Username Anda:");

  if (!username) return;

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);

  if (data.user) {
    await supabaseClient.from('profiles').insert([{ id: data.user.id, username: username, points: 0 }]);
    alert("Berhasil Daftar! Silakan Login.");
  }
});

document.getElementById('btn-login')?.addEventListener('click', async () => {
  const email = document.getElementById('acc-email').value;
  const password = document.getElementById('acc-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert(error.message); else checkUserSession();
});

document.getElementById('btn-logout')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

// Jalankan pengecekan session saat load
checkUserSession();

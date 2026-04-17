'use strict';

const SUPABASE_URL = 'https://edqrjrqdhaolfoehbaow.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkcXJqcnFkaGFvbGZvZWhiYW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MjM1NTEsImV4cCI6MjA5MTk5OTU1MX0.02MISDYOGcf6DFy8ZPzgHkA_N4zglPFUi1b_FN15ueY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// NAVIGASI
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const target = this.getAttribute("data-nav-link").toLowerCase();
    pages.forEach((page, index) => {
      if (target === page.dataset.page) {
        page.classList.add("active");
        navigationLinks[index].classList.add("active");
        if (target === 'blog') loadPosts();
        if (target === 'event') loadLeaderboard();
      } else {
        page.classList.remove("active");
        navigationLinks[index].classList.remove("active");
      }
    });
  });
}

// LOAD NEWS
async function loadPosts() {
  const list = document.getElementById('posts-list');
  const { data: posts, error } = await supabaseClient.from('news_posts').select('*');
  if (error) return console.error(error);
  
  list.innerHTML = posts.map(p => `
    <li class="blog-post-item" onclick="viewDetail(${p.id})" style="cursor:pointer; margin-bottom: 20px;">
      <h3 class="h3" style="color: #ffffff;">${p.title}</h3>
      <p style="color: #ffffff; opacity: 0.7;">${p.content.substring(0, 50)}...</p>
    </li>
  `).join('');
}

window.viewDetail = async (id) => {
  const { data: post } = await supabaseClient.from('news_posts').select('*').eq('id', id).single();
  document.getElementById('blog-list-container').style.display = 'none';
  document.getElementById('blog-detail').style.display = 'block';
  document.getElementById('post-full-content').innerText = post.content;
};

document.getElementById('back-to-blog').onclick = () => {
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail').style.display = 'none';
};

// AUTH
async function checkUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data: profile } = await supabaseClient.from('profiles').select('*').eq('id', session.user.id).single();
    document.getElementById('auth-ui').style.display = 'none';
    document.getElementById('profile-ui').style.display = 'block';
    document.getElementById('user-name').innerText = profile.username;
    document.getElementById('user-role').innerText = profile.role;
    document.getElementById('user-points').innerText = profile.points;
  }
}

document.getElementById('btn-login')?.addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) alert(error.message); else location.reload();
});

document.getElementById('btn-logout')?.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  location.reload();
});

checkUser();

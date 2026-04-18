'use strict';

// --- UTILS ---
const elementToggleFunc = (elem) => elem.classList.toggle("active");

// --- NAVIGATION ---
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

navigationLinks.forEach((nav, i) => {
  nav.addEventListener("click", function () {
    const clickedPage = this.innerText.toLowerCase().trim();
    pages.forEach((page, j) => {
      if (clickedPage === page.dataset.page) {
        page.classList.add("active");
        navigationLinks[j].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        page.classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    });
  });
});

// --- SUPABASE CONFIG ---
const SUPABASE_URL = 'https://pddlqipctqacvzmoydgy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkZGxxaXBjdHFhY3Z6bW95ZGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzEyNjksImV4cCI6MjA5MjAwNzI2OX0.MRq6Z0Njg-w6ALw5lJo7r8Ijn6xRAF-aq6PvJnmuGpw';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * AUTH ACTIONS (English Version)
 */
window.addEventListener('click', async function(event) {
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const userInput = document.getElementById('auth-username');

  // LOGIN
  if (event.target.closest('#login-btn-final')) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    else checkAccountStatus();
  }

  // REGISTER (With Profile Sync)
  if (event.target.closest('#register-btn-final')) {
    if (!userInput.value) return Swal.fire({ icon: 'warning', text: 'Please enter a username' });
    
    // 1. Auth Sign Up
    const { data, error: authError } = await supabaseClient.auth.signUp({
      email: emailInput.value,
      password: passInput.value,
      options: { data: { display_name: userInput.value } }
    });

    if (authError) return Swal.fire({ icon: 'error', text: authError.message, background: '#1e1e1f', color: '#fff' });

    // 2. Insert into Profiles Table manually to prevent "Failed to send" comment error
    if (data.user) {
      await supabaseClient.from('profiles').insert([
        { 
          id: data.user.id, 
          email: data.user.email, 
          username: userInput.value,
          full_name: userInput.value 
        }
      ]);
    }

    Swal.fire({ icon: 'success', text: 'Registration successful! You can now login.', background: '#1e1e1f', color: '#fff' });
  }

  // LOGOUT
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
});

/**
 * BLOG & COMMENT SYSTEM
 */
window.currentBlogId = null;

window.showBlogDetail = async function(id, title, text) {
  window.currentBlogId = id;
  document.getElementById('blog-list-container').style.display = 'none';
  document.getElementById('blog-detail-container').style.display = 'block';
  document.getElementById('detail-title').innerText = title;
  document.getElementById('detail-text').innerText = text;

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const { data: { user } } = await supabaseClient.auth.getUser();
  const formArea = document.getElementById('comment-form-area');
  
  if (!user) {
    formArea.innerHTML = `<p style="color: var(--orange-yellow-crayola); font-size: 14px;">Please login to leave a comment.</p>`;
  } else {
    formArea.innerHTML = `
      <textarea id="comment-input" class="form-input" placeholder="Write your comment..." style="min-height: 80px; margin-bottom: 15px;"></textarea>
      <button class="form-btn" onclick="postComment()" style="width: max-content; padding: 10px 20px;">
        <ion-icon name="paper-plane-outline"></ion-icon><span>Post Comment</span>
      </button>
    `;
  }
  loadComments(id);
};

window.closeBlogDetail = () => {
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail-container').style.display = 'none';
};

window.loadComments = async function(blogId) {
  const displayList = document.getElementById('comments-display-list');
  const { data: comments, error } = await supabaseClient
    .from('comments')
    .select('content, created_at, profiles(username, role, email)')
    .eq('post_id', blogId)
    .order('created_at', { ascending: false });

  if (error) return console.error(error);

  if (!comments || comments.length === 0) {
    displayList.innerHTML = `<p style="color: var(--light-gray-70); text-align: center;">No comments yet.</p>`;
  } else {
    displayList.innerHTML = comments.map(c => `
      <div class="comment-item" style="margin-bottom: 25px; border-bottom: 1px solid var(--jet); padding-bottom: 15px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <h4 class="h4" style="font-size: 16px; color: var(--orange-yellow-crayola); margin: 0;">${c.profiles?.username || 'User'}</h4>
          <span style="font-size: 12px; color: var(--light-gray-70);">${c.profiles?.email || ''}</span>
        </div>
        <p style="font-size: 14px; color: var(--light-gray); margin-bottom: 10px;">${c.content}</p>
        <div style="display: flex; gap: 15px; font-size: 11px;">
          <span style="color: #fbbf24; text-transform: uppercase;">${c.profiles?.role || 'Member'}</span>
          <span style="color: var(--light-gray-70);">${new Date(c.created_at).toLocaleTimeString()}</span>
        </div>
      </div>
    `).join('');
  }
};

window.postComment = async function() {
  const input = document.getElementById('comment-input');
  const content = input?.value;
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!content || content.trim() === '') return;

  const { error } = await supabaseClient.from('comments').insert([
    { post_id: window.currentBlogId, user_id: user.id, content: content.trim() }
  ]);

  if (error) {
    console.error(error);
    Swal.fire({ icon: 'error', title: 'Action Failed', text: 'Error: ' + error.message, background: '#1e1e1f', color: '#fff' });
  } else {
    input.value = '';
    await loadComments(window.currentBlogId);
    Swal.fire({ icon: 'success', text: 'Comment posted!', background: '#1e1e1f', color: '#fff', timer: 1000, showConfirmButton: false });
  }
};

// Initial run
checkAccountStatus();

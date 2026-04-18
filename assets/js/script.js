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
 * Page Navigation
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
      } else {
        pages[j].classList.remove("active");
        navigationLinks[j].classList.remove("active");
      }
    }
  });
}

// --- SUPABASE INITIALIZATION ---
const SUPABASE_URL = 'https://xhbmfsrwpebyunjxxmio.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoYm1mc3J3cGVieXVuanh4bWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NzkzOTksImV4cCI6MjA5MjA1NTM5OX0.EiFkHOoS2kegWrmPG9BP_nSaBqV3FKWbTZF-jWJupe0';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * UNIFIED CLICK HANDLER (Auth, Reset, Register)
 */
window.addEventListener('click', async function(event) {
  const gCont = document.getElementById('guest-container');
  const aCont = document.getElementById('auth-container');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const editSection = document.getElementById('edit-username-section');
  
  // 1. Reset Password (FIXED)
  if (event.target.closest('#btn-forgot-pass')) {
    const email = emailInput?.value;
    if (!email) {
      return Swal.fire({ icon: 'info', text: 'Please enter your email address first!', background: '#1e1e1f', color: '#fff' });
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', title: 'Email Sent', text: 'Please check your inbox to reset your password.', background: '#1e1e1f', color: '#fff' });
    }
  }

  // 2. Register Action (New Implementation)
  if (event.target.closest('#register-btn-final')) {
    const displayName = document.getElementById('reg-username')?.value; // Make sure you have this ID in HTML
    const email = emailInput.value;
    const password = passInput.value;

    if (!email || !password) return Swal.fire({ icon: 'warning', text: 'Please fill in all fields' });

    const { error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || 'New Member' } }
    });

    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', title: 'Registration Successful', text: 'Please check your email to verify your account.', background: '#1e1e1f', color: '#fff' });
    }
  }

  // 3. Login Action (With Alert)
  if (event.target.closest('#login-btn-final')) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', text: 'Login successful! Welcome back.', timer: 1500, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    }
  }

  // 4. Logout Action (With Alert)
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    await Swal.fire({ icon: 'success', text: 'Logged out successfully.', timer: 1500, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    location.reload();
  }

  // 5. Submit Update Username (With Alert)
  if (event.target.closest('#btn-submit-username')) {
    const password = document.getElementById('confirm-password').value;
    const newName = document.getElementById('new-username').value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    const { error: authError } = await supabaseClient.auth.signInWithPassword({ email: user.email, password });
    if (authError) return Swal.fire({ icon: 'error', text: 'Invalid confirmation password!', background: '#1e1e1f', color: '#fff' });

    const { error: updateError } = await supabaseClient.auth.updateUser({ data: { display_name: newName } });
    if (updateError) {
      Swal.fire({ icon: 'error', text: updateError.message });
    } else {
      await Swal.fire({ icon: 'success', text: 'Username updated successfully!', background: '#1e1e1f', color: '#fff' });
      if (editSection) editSection.style.display = 'none';
      checkAccountStatus(); 
    }
  }

  // Navigation Logic
  if (event.target.closest('#btn-start-auth')) {
    gCont.style.setProperty('display', 'none', 'important');
    aCont.style.setProperty('display', 'block', 'important');
  }
  if (event.target.closest('#btn-cancel-auth')) {
    aCont.style.setProperty('display', 'none', 'important');
    gCont.style.setProperty('display', 'block', 'important');
  }
  if (event.target.closest('#btn-show-edit')) {
    if (editSection) editSection.style.display = (editSection.style.display === 'none' || editSection.style.display === '') ? 'block' : 'none';
  }
});

/**
 * UI ENGINE
 */
async function checkAccountStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const guest = document.getElementById('guest-container');
  const auth = document.getElementById('auth-container');
  const profile = document.getElementById('profile-container');
  const display = document.getElementById('user-info-display');

  if (guest) guest.style.display = 'none';
  if (auth) auth.style.display = 'none';
  if (profile) profile.style.display = 'none';

  if (user) {
    if (profile) profile.style.display = 'block';
    const { data: p } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    const date = new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    display.innerHTML = `
      <div style="background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet); margin-bottom: 15px;">
        <h4 class="h4" style="color: var(--orange-yellow-crayola);">${user.user_metadata.display_name || 'Member'}</h4>
        <p style="font-size: 13px; color: var(--light-gray-70);">${user.email}</p>
        <p style="font-size: 11px; margin-top: 10px; color: #fbbf24; font-weight: bold;">ROLE: ${p?.role || 'Member'}</p>
        <p style="font-size: 10px; color: var(--light-gray-70); margin-top: 5px;">Joined: ${date}</p>
      </div>
    `;
    if (window.currentBlogId) loadComments(window.currentBlogId);
  } else {
    if (guest) guest.style.display = 'block';
  }
}

/**
 * COMMENT SYSTEM (All Alerted)
 */
window.postComment = async function() {
  const input = document.getElementById('comment-input');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !input.value.trim()) return;

  const { error } = await supabaseClient
    .from('comments')
    .insert([{ post_id: window.currentBlogId, user_id: user.id, content: input.value.trim() }]);

  if (error) {
    Swal.fire({ icon: 'error', text: 'Failed to post comment', background: '#1e1e1f', color: '#fff' });
  } else {
    await Swal.fire({ icon: 'success', text: 'Comment posted!', timer: 1500, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    input.value = ''; 
    loadComments(window.currentBlogId);
  }
};

window.deleteComment = async function(commentId) {
  const result = await Swal.fire({
    text: "Are you sure you want to delete this comment?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ff5f5f',
    background: '#1e1e1f',
    color: '#fff'
  });
  if (result.isConfirmed) {
    const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
    if (error) {
      Swal.fire({ icon: 'error', text: "Failed to delete comment" });
    } else {
      Swal.fire({ icon: 'success', text: "Comment deleted", timer: 1200, showConfirmButton: false });
      loadComments(window.currentBlogId);
    }
  }
};

// ... (Load Comments & Blog Details functionality remains same as your previous version)
window.loadComments = async function(blogId) {
  const displayList = document.getElementById('comments-display-list');
  const { data: comments } = await supabaseClient.from('comments').select(`id, content, created_at, user_id, profiles (username, role)`).eq('post_id', blogId).order('created_at', { ascending: false });
  if (comments) {
    displayList.innerHTML = comments.map(c => `
      <div style="background: var(--onyx); padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--jet);">
        <p style="color: var(--orange-yellow-crayola); font-weight: bold; font-size: 14px;">${c.profiles?.username || 'User'}</p>
        <p style="color: var(--light-gray); font-size: 14px; margin-top: 5px;">${c.content}</p>
      </div>
    `).join('');
  }
};

supabaseClient.auth.onAuthStateChange(() => { checkAccountStatus(); });
document.addEventListener("DOMContentLoaded", () => { checkAccountStatus(); });


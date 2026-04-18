'use strict';

/**
 * Element toggle function
 */
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

/**
 * Sidebar & Navigation Logic
 */
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });

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
 * UNIFIED CLICK HANDLER (Auth & Profile)
 */
window.addEventListener('click', async function(event) {
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const editSection = document.getElementById('edit-username-section');

  // 1. RESET PASSWORD (FIXED)
  if (event.target.closest('#btn-forgot-pass')) {
    const email = emailInput?.value;
    if (!email) {
      return Swal.fire({ icon: 'info', text: 'Masukkan email kamu di kolom login dulu!', background: '#1e1e1f', color: '#fff' });
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Memastikan link kembali ke website kamu
    });

    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', title: 'Email Terkirim!', text: 'Cek kotak masuk atau spam email kamu.', background: '#1e1e1f', color: '#fff' });
    }
  }

  // 2. LOGIN ACTION (WITH ALERT)
  if (event.target.closest('#login-btn-final')) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', text: 'Login Berhasil!', timer: 1500, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    }
  }

  // 3. LOGOUT ACTION (WITH ALERT)
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    await Swal.fire({ icon: 'success', text: 'Sampai jumpa lagi!', timer: 1200, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    location.reload();
  }

  // 4. CHANGE USERNAME (WITH ALERT)
  if (event.target.closest('#btn-show-edit')) {
    if (editSection) editSection.style.display = (editSection.style.display === 'none' || editSection.style.display === '') ? 'block' : 'none';
  }

  if (event.target.closest('#btn-submit-username')) {
    const password = document.getElementById('confirm-password').value;
    const newName = document.getElementById('new-username').value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    const { error: authError } = await supabaseClient.auth.signInWithPassword({ email: user.email, password: password });
    if (authError) return Swal.fire({ icon: 'error', text: 'Password konfirmasi salah!' });

    const { error: updateError } = await supabaseClient.auth.updateUser({ data: { display_name: newName } });
    if (updateError) {
      Swal.fire({ icon: 'error', text: updateError.message });
    } else {
      await Swal.fire({ icon: 'success', text: 'Username diperbarui!', background: '#1e1e1f', color: '#fff' });
      editSection.style.display = 'none';
      checkAccountStatus(); 
    }
  }

  // Auth UI Toggle
  if (event.target.closest('#btn-start-auth')) {
    document.getElementById('guest-container').style.setProperty('display', 'none', 'important');
    document.getElementById('auth-container').style.setProperty('display', 'block', 'important');
  }
  if (event.target.closest('#btn-cancel-auth')) {
    document.getElementById('auth-container').style.setProperty('display', 'none', 'important');
    document.getElementById('guest-container').style.setProperty('display', 'block', 'important');
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
    
    display.innerHTML = `
      <div style="background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet); margin-bottom: 15px;">
        <h4 class="h4" style="color: var(--orange-yellow-crayola); font-size: 20px;">${user.user_metadata.display_name || 'Member'}</h4>
        <p style="font-size: 13px; color: var(--light-gray-70);">${user.email}</p>
        <p style="font-size: 11px; margin-top: 10px; color: #fbbf24; font-weight: bold;">ROLE: ${p?.role || 'Member'}</p>
      </div>
    `;
    if (window.currentBlogId) loadComments(window.currentBlogId);
  } else {
    if (guest) guest.style.display = 'block';
  }
}

/**
 * COMMENT SYSTEM (WITH ALERT)
 */
window.postComment = async function() {
  const input = document.getElementById('comment-input');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !input.value.trim()) return;

  const { error } = await supabaseClient
    .from('comments')
    .insert([{ post_id: window.currentBlogId, user_id: user.id, content: input.value.trim() }]);

  if (error) {
    Swal.fire({ icon: 'error', text: 'Gagal mengirim komentar', background: '#1e1e1f', color: '#fff' });
  } else {
    await Swal.fire({ icon: 'success', text: 'Komentar Terkirim!', timer: 1500, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    input.value = ''; 
    loadComments(window.currentBlogId);
  }
};

// ... (Sisanya: loadComments, showBlogDetail tetap sama)
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
    formArea.innerHTML = `<p style="color: var(--orange-yellow-crayola); font-size: 14px;">Login untuk berkomentar.</p>`;
  } else {
    formArea.innerHTML = `
      <textarea id="comment-input" class="form-input" placeholder="Tulis komentar..." required></textarea>
      <button class="form-btn" onclick="postComment()">Kirim Komentar</button>
    `;
  }
  loadComments(id);
};

window.closeBlogDetail = function() {
  window.currentBlogId = null;
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail-container').style.display = 'none';
};

window.loadComments = async function(blogId) {
  const displayList = document.getElementById('comments-display-list');
  const { data: comments } = await supabaseClient.from('comments').select(`id, content, created_at, profiles (username)`).eq('post_id', blogId).order('created_at', { ascending: false });
  if (comments) {
    displayList.innerHTML = comments.map(c => `
      <div style="background: var(--onyx); padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--jet);">
        <p style="color: var(--orange-yellow-crayola); font-weight: bold; font-size: 13px;">${c.profiles?.username || 'User'}</p>
        <p style="color: var(--light-gray); font-size: 14px; margin-top: 5px;">${c.content}</p>
      </div>
    `).join('');
  }
};

supabaseClient.auth.onAuthStateChange(() => { checkAccountStatus(); });
document.addEventListener("DOMContentLoaded", () => { checkAccountStatus(); });

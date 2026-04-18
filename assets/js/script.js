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
 * Navigation & Filter Logic (Tetap dipertahankan)
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
 * UNIFIED CLICK HANDLER (Auth, Reset Password, & Profile)
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
      return Swal.fire({ icon: 'info', text: 'Masukkan email kamu di kolom login terlebih dahulu!', background: '#1e1e1f', color: '#fff' });
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', title: 'Email Terkirim', text: 'Cek kotak masuk/spam email kamu untuk reset password.', background: '#1e1e1f', color: '#fff' });
    }
  }

  // 2. Login Action (With Notification)
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

  // 3. Logout Action (With Notification)
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    await Swal.fire({ icon: 'success', text: 'Logout Berhasil!', timer: 1200, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    location.reload();
  }

  // 4. Toggle Form Edit Username
  if (event.target.closest('#btn-show-edit')) {
    if (editSection) {
      const isHidden = editSection.style.display === 'none' || editSection.style.display === '';
      editSection.style.display = isHidden ? 'block' : 'none';
    }
  }

  // 5. Submit Update Username
  if (event.target.closest('#btn-submit-username')) {
    const password = document.getElementById('confirm-password').value;
    const newName = document.getElementById('new-username').value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!password || !newName) return Swal.fire({ icon: 'warning', text: 'Field tidak boleh kosong' });

    const { error: authError } = await supabaseClient.auth.signInWithPassword({ email: user.email, password: password });
    if (authError) return Swal.fire({ icon: 'error', text: 'Password konfirmasi salah!' });

    const { error: updateError } = await supabaseClient.auth.updateUser({ data: { display_name: newName } });
    if (updateError) {
      Swal.fire({ icon: 'error', text: updateError.message });
    } else {
      await Swal.fire({ icon: 'success', text: 'Username diperbarui!', background: '#1e1e1f', color: '#fff' });
      if (editSection) editSection.style.display = 'none';
      checkAccountStatus(); 
    }
  }

  // 6. Auth UI Navigation
  if (event.target.closest('#btn-start-auth')) {
    gCont.style.setProperty('display', 'none', 'important');
    aCont.style.setProperty('display', 'block', 'important');
  }
  if (event.target.closest('#btn-cancel-auth')) {
    aCont.style.setProperty('display', 'none', 'important');
    gCont.style.setProperty('display', 'block', 'important');
  }
});

/**
 * UI ENGINE: Fetch Status & Role
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
    const userRole = p?.role || 'Member';
    const date = new Date(user.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    display.innerHTML = `
      <div style="background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet); margin-bottom: 15px;">
        <h4 class="h4" style="color: var(--orange-yellow-crayola);">${user.user_metadata.display_name || 'Member'}</h4>
        <p style="font-size: 13px; color: var(--light-gray-70);">${user.email}</p>
        <p style="font-size: 11px; margin-top: 10px; color: #fbbf24; font-weight: bold;">ROLE: ${userRole}</p>
        <div style="border-top: 1px solid var(--jet); margin-top: 10px; padding-top: 8px; font-size: 10px; color: var(--light-gray-70);">Joined: ${date}</div>
      </div>
    `;
  } else {
    if (guest) guest.style.display = 'block';
  }
}

/**
 * COMMENT SYSTEM (With Notifications)
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
    // NOTIFIKASI BERHASIL
    Swal.fire({ icon: 'success', text: 'Komentar berhasil diposting!', timer: 1500, showConfirmButton: false, background: '#1e1e1f', color: '#fff' });
    input.value = ''; 
    loadComments(window.currentBlogId);
  }
};

// ... (Fungsi loadComments & showBlogDetail tetap sama dengan versi fungsional kamu sebelumnya)
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
    formArea.innerHTML = `<p style="color: var(--orange-yellow-crayola); font-size: 14px;">Please login to join the conversation.</p>`;
  } else {
    formArea.innerHTML = `
      <textarea id="comment-input" class="form-input" placeholder="Write your comment..." required></textarea>
      <button class="form-btn" onclick="postComment()">Post Comment</button>
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
  const { data: comments } = await supabaseClient.from('comments').select(`id, content, created_at, user_id, profiles (username, role)`).eq('post_id', blogId).order('created_at', { ascending: false });
  if (comments) {
    displayList.innerHTML = comments.map(c => `
      <div class="comment-item" style="background: var(--onyx); padding: 15px; border-radius: 10px; border: 1px solid var(--jet); margin-bottom: 15px;">
        <h4 style="color: var(--orange-yellow-crayola); font-size: 14px;">${c.profiles?.username || 'User'}</h4>
        <p style="color: var(--light-gray); font-size: 14px; margin-top: 5px;">${c.content}</p>
      </div>
    `).join('');
  } else {
    displayList.innerHTML = `<p style="color: var(--light-gray-70); text-align: center;">Belum ada komentar.</p>`;
  }
};

supabaseClient.auth.onAuthStateChange(() => { checkAccountStatus(); });
document.addEventListener("DOMContentLoaded", () => { checkAccountStatus(); });

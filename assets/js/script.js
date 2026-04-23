'use strict';

const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn) {
  sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });
}

const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {
    const clickedPageText = this.innerText.toLowerCase().trim();
    // Map Indonesian text to data-page attributes
    const pageMap = {
      'beranda': 'home',
      'acara': 'event',
      'blog': 'blog',
      'akun': 'account'
    };
    
    const targetPage = pageMap[clickedPageText];

    for (let j = 0; j < pages.length; j++) {
      if (targetPage === pages[j].dataset.page) {
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

window.addEventListener('click', async function(event) {
  const gCont = document.getElementById('guest-container');
  const aCont = document.getElementById('auth-container');
  const editSection = document.getElementById('edit-username-section');
  
  if (event.target.closest('#btn-show-edit')) {
    if (editSection) {
      const isHidden = editSection.style.display === 'none' || editSection.style.display === '';
      editSection.style.display = isHidden ? 'block' : 'none';
    }
  }

  if (event.target.closest('#btn-submit-username')) {
    const password = document.getElementById('confirm-password').value;
    const newName = document.getElementById('new-username').value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!password || !newName) {
      return Swal.fire({ icon: 'warning', text: 'Harap isi semua kolom', background: '#1e1e1f', color: '#fff' });
    }

    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: password
    });

    if (authError) {
      return Swal.fire({ icon: 'error', text: 'Kata sandi salah!', background: '#1e1e1f', color: '#fff' });
    }

    const { error: updateAuthError } = await supabaseClient.auth.updateUser({
      data: { display_name: newName }
    });

    const { data: updatedRows, error: updateTableError } = await supabaseClient
      .from('profiles')
      .update({ username: newName })
      .eq('id', user.id)
      .select();

    if (updateAuthError || updateTableError || !updatedRows || updatedRows.length === 0) {
      Swal.fire({ icon: 'error', text: 'Gagal memperbarui! Cek izin database (RLS).', background: '#1e1e1f', color: '#fff' });
    } else {
      await Swal.fire({ icon: 'success', text: 'Nama pengguna berhasil diperbarui!', background: '#1e1e1f', color: '#fff' });
      if (editSection) editSection.style.display = 'none';
      document.getElementById('confirm-password').value = '';
      document.getElementById('new-username').value = '';
      checkAccountStatus(); 
    }
  }

  if (event.target.closest('#btn-start-auth')) {
    gCont.style.setProperty('display', 'none', 'important');
    aCont.style.setProperty('display', 'block', 'important');
  }

  if (event.target.closest('#btn-cancel-auth')) {
    aCont.style.setProperty('display', 'none', 'important');
    gCont.style.setProperty('display', 'block', 'important');
  }

  if (event.target.closest('#login-btn-final')) {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) Swal.fire({ icon: 'error', text: 'Email atau password salah', background: '#1e1e1f', color: '#fff' });
  }

  if (event.target.closest('#register-btn-final')) {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const nameInput = document.getElementById('auth-username');

    if (!emailInput.value || !passInput.value || !nameInput.value) {
      return Swal.fire({ icon: 'warning', text: 'Semua kolom wajib diisi untuk pendaftaran', background: '#1e1e1f', color: '#fff' });
    }

    const { error } = await supabaseClient.auth.signUp({
      email: emailInput.value,
      password: passInput.value,
      options: {
        data: { display_name: nameInput.value },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', text: 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.', background: '#1e1e1f', color: '#fff' });
    }
  }

  if (event.target.closest('#btn-reset-password')) {
    const emailInput = document.getElementById('auth-email');
    if (!emailInput || !emailInput.value) {
      return Swal.fire({ icon: 'warning', text: 'Silakan masukkan email Anda terlebih dahulu', background: '#1e1e1f', color: '#fff' });
    }
    const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput.value, {
      redirectTo: window.location.href, 
    });
    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', text: 'Instruksi reset telah dikirim ke email Anda!', background: '#1e1e1f', color: '#fff' });
    }
  }

  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
});

supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Kata Sandi Anda',
      input: 'password',
      inputLabel: 'Masukkan kata sandi baru',
      inputPlaceholder: 'Kata Sandi Baru',
      showCancelButton: false,
      confirmButtonText: 'Perbarui Kata Sandi',
      background: '#1e1e1f',
      color: '#fff'
    });

    if (newPassword) {
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) Swal.fire({ icon: 'error', text: error.message });
      else {
        Swal.fire({ icon: 'success', text: 'Kata sandi berhasil diperbarui!' });
        window.location.hash = ''; 
      }
    }
  }
  checkAccountStatus();
});

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
    const { data: profileData } = await supabaseClient.from('profiles').select('role, username, points').eq('id', user.id).single();

    const userRole = profileData?.role || 'Member';
    const displayName = profileData?.username || user.user_metadata.display_name || 'Member';
    const userPoints = profileData?.points || 0; 

    const date = new Date(user.created_at).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    if (display) {
      display.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div style="background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet); grid-column: span 2;">
            <h4 class="h4" style="font-size: 24px; color: var(--orange-yellow-crayola); margin-bottom: 4px;">${displayName}</h4>
            <p style="font-size: 14px; color: var(--light-gray); margin-bottom: 8px;">${user.email}</p>
            <div style="border-top: 1px solid var(--jet); padding-top: 8px; font-size: 11px; color: var(--light-gray-70);">Bergabung: ${date}</div>
          </div>
          <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Poin</p>
            <p style="font-size: 20px; font-weight: 600; color: #fbbf24;">${userPoints}</p>
          </div>
          <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Peran</p>
            <p style="font-size: 20px; font-weight: 600; color: #fbbf24;">${userRole}</p>
          </div>
        </div>
      `;
    }
    if (window.currentBlogId) loadComments(window.currentBlogId);
  } else {
    if (guest) guest.style.display = 'block';
  }
}

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
    formArea.innerHTML = `<p style="color: var(--orange-yellow-crayola); font-size: 14px; margin-bottom: 30px;">Silakan login untuk bergabung dalam percakapan.</p>`;
  } else {
    formArea.innerHTML = `
      <textarea id="comment-input" class="form-input" placeholder="Tulis komentar Anda..." required style="min-height: 80px; margin-bottom: 15px; resize: vertical;"></textarea>
      <button class="form-btn" onclick="postComment()" style="width: max-content; padding: 10px 20px;">
        <ion-icon name="paper-plane-outline"></ion-icon><span>Kirim Komentar</span>
      </button>
    `;
  }
  loadComments(id);
};

window.closeBlogDetail = function() {
  window.currentBlogId = null;
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail-container').style.display = 'none';
};

window.renderCommentHTML = function(c, currentUser) {
  const username = c.profiles?.username || 'Anonim';
  const role = c.profiles?.role || 'Member';
  const isOwner = currentUser && currentUser.id === c.user_id;
  const isAdmin = currentUser && currentUser.role === 'Admin';

  return `
    <div class="comment-item" style="margin-bottom: 30px; background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div>
          <h4 class="h4" style="font-size: 16px; color: var(--orange-yellow-crayola); margin: 0;">${username}</h4>
        </div>
        <div style="text-align: right;">
          <span style="display: block; font-size: 10px; color: #fbbf24; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">${role}</span>
          <span style="font-size: 10px; color: var(--light-gray-70);">${new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
      <div style="border-top: 1px solid var(--jet); margin-bottom: 15px;"></div>
      <p style="font-size: 15px; color: var(--light-gray); line-height: 1.6; margin-bottom: 15px;">${c.content}</p>
      ${(isOwner || isAdmin) ? `<button onclick="deleteComment('${c.id}')" style="color: #ff5f5f; font-size: 12px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 0;"><ion-icon name="trash-outline"></ion-icon> Hapus Komentar</button>` : ''}
    </div>
  `;
};

window.loadComments = async function(blogId) {
  const displayList = document.getElementById('comments-display-list');
  if(!displayList) return;
  const { data: { user } } = await supabaseClient.auth.getUser();
  let currentUserData = null;
  if (user) {
    const { data: p } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single();
    currentUserData = { id: user.id, role: p?.role };
  }
  const { data: comments, error } = await supabaseClient.from('comments').select(`id, content, created_at, user_id, profiles (username, role)`).eq('post_id', blogId).order('created_at', { ascending: false });
  if (error) return;
  displayList.innerHTML = (!comments || comments.length === 0) ? `<p style="color: var(--light-gray-70); text-align: center;">Belum ada komentar.</p>` : comments.map(c => renderCommentHTML(c, currentUserData)).join('');
};

window.postComment = async function() {
  const input = document.getElementById('comment-input');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !input.value.trim()) return;
  const { error } = await supabaseClient.from('comments').insert([{ post_id: window.currentBlogId, user_id: user.id, content: input.value.trim() }]);
  if (error) return Swal.fire({ icon: 'error', text: 'Gagal mengirim komentar' });
  input.value = ''; 
  loadComments(window.currentBlogId);
};

window.deleteComment = async function(commentId) {
  const result = await Swal.fire({ text: "Hapus komentar ini?", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ff5f5f', background: '#1e1e1f', color: '#fff' });
  if (result.isConfirmed) {
    await supabaseClient.from('comments').delete().eq('id', commentId);
    loadComments(window.currentBlogId);
  }
};

async function loadLeaderboard() {
  const tableBody = document.getElementById('leaderboard-body');
  const adminTh = document.getElementById('admin-th');
  if (!tableBody) return;
  tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:var(--light-gray);">Memuat data...</td></tr>';
  try {
    const { data: users, error: dbError } = await supabaseClient.from('profiles').select('id, username, points').order('points', { ascending: false });
    if (dbError) throw dbError;
    let isAdmin = false;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role?.toLowerCase() === 'admin') isAdmin = true;
    }
    if (adminTh) adminTh.style.display = isAdmin ? 'table-cell' : 'none';
    tableBody.innerHTML = users.map((user, index) => `
        <tr style="background: var(--onyx); border-bottom: 5px solid var(--smoky-black);">
          <td style="padding: 15px; text-align: center; border-radius: 12px 0 0 12px; font-weight: bold;">${index + 1}</td>
          <td style="padding: 15px; color: var(--white-2);">${user.username || 'Anonim'}</td>
          <td style="padding: 15px; text-align: right; color: var(--orange-yellow-crayola); font-weight: bold;">${user.points || 0}</td>
          ${isAdmin ? `<td style="padding: 15px; text-align: center; border-radius: 0 12px 12px 0;"><button onclick="updatePoints('${user.id}', '${user.username}', ${user.points})" style="background: transparent; color: var(--orange-yellow-crayola); border: 1px solid var(--orange-yellow-crayola); padding: 5px 10px; border-radius: 8px; font-size: 11px; cursor: pointer;">EDIT</button></td>` : `<td style="border-radius: 0 12px 12px 0;"></td>`}
        </tr>`).join('');
  } catch (err) { tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red; padding:20px;">Error: ${err.message}</td></tr>`; }
}

document.querySelectorAll("[data-nav-link]").forEach(link => {
  link.addEventListener("click", function() {
    if (this.innerText.toLowerCase().trim() === "acara") loadLeaderboard();
  });
});

window.updatePoints = async function(userId, username, currentPoints) {
  const { value: newPoints } = await Swal.fire({ title: `Update Poin: ${username}`, input: 'number', inputValue: currentPoints, background: '#1e1e1f', color: '#fff', confirmButtonText: 'Simpan', cancelButtonText: 'Batal', showCancelButton: true });
  if (newPoints) {
    await supabaseClient.from('profiles').update({ points: parseInt(newPoints) }).eq('id', userId);
    loadLeaderboard();
  }
};

document.addEventListener("DOMContentLoaded", checkAccountStatus);

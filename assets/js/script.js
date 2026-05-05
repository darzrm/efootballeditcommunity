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
 * Filter & Custom Select
 */
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-select-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");
const filterItems = document.querySelectorAll("[data-filter-item]");

if (select) {
  select.addEventListener("click", function () { elementToggleFunc(this); });
}

const filterFunc = function (selectedValue) {
  for (let i = 0; i < filterItems.length; i++) {
    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }
  }
}

for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {
    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);
  });
}

if (filterBtn.length > 0) {
  let lastClickedBtn = filterBtn[0];
  for (let i = 0; i < filterBtn.length; i++) {
    filterBtn[i].addEventListener("click", function () {
      let selectedValue = this.innerText.toLowerCase();
      selectValue.innerText = this.innerText;
      filterFunc(selectedValue);
      lastClickedBtn.classList.remove("active");
      this.classList.add("active");
      lastClickedBtn = this;
    });
  }
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
 * LAST SEEN / ONLINE STATUS SYSTEM
 * Update last_seen setiap 2 menit selama user aktif
 * User dianggap Online jika last_seen < 5 menit yang lalu
 */
async function updateLastSeen() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  await supabaseClient
    .from('profiles')
    .update({ last_seen: new Date().toISOString() })
    .eq('id', user.id);
}

// Update saat halaman dibuka, lalu setiap 2 menit
updateLastSeen();
setInterval(updateLastSeen, 2 * 60 * 1000);

// Update juga saat user melakukan aktivitas (klik / ketik)
let lastActivityUpdate = 0;
document.addEventListener('click', () => {
  const now = Date.now();
  if (now - lastActivityUpdate > 60 * 1000) {
    lastActivityUpdate = now;
    updateLastSeen();
  }
});

/**
 * UNIFIED CLICK HANDLER
 */
window.addEventListener('click', async function(event) {
  const gCont = document.getElementById('guest-container');
  const aCont = document.getElementById('auth-container');
  const editSection = document.getElementById('edit-username-section');
  
  // 1. Change Username: Toggle Form
  if (event.target.closest('#btn-show-edit')) {
    if (editSection) {
      const isHidden = editSection.style.display === 'none' || editSection.style.display === '';
      editSection.style.display = isHidden ? 'block' : 'none';
    }
  }

  // 2. Change Username: Submit Update (Auth Metadata + Profile Table)
  if (event.target.closest('#btn-submit-username')) {
    const password = document.getElementById('confirm-password').value;
    const newName = document.getElementById('new-username').value;
    
    if (newName.length > 12) {
      return Swal.fire({ icon: 'error', text: 'Username cannot exceed 12 characters!', background: '#1e1e1f', color: '#fff' });
    }
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!password || !newName) {
      return Swal.fire({ icon: 'warning', text: 'Please fill in all fields', background: '#1e1e1f', color: '#fff' });
    }

    // Re-autentikasi untuk keamanan sebelum ganti nama
    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: password
    });

    if (authError) {
      return Swal.fire({ icon: 'error', text: 'Incorrect password!', background: '#1e1e1f', color: '#fff' });
    }

  // Update Auth Metadata
  const { error: updateAuthError } = await supabaseClient.auth.updateUser({
    data: { display_name: newName }
  });

  // Update Tabel Profiles
  const { data: updatedRows, error: updateTableError } = await supabaseClient
    .from('profiles')
    .update({ username: newName })
    .eq('id', user.id)
    .select(); // <-- This forces Supabase to return the updated row

  // Check if it failed OR if 0 rows were updated
  if (updateAuthError || updateTableError || !updatedRows || updatedRows.length === 0) {
    Swal.fire({ icon: 'error', text: 'Update failed! Check your database permissions (RLS).', background: '#1e1e1f', color: '#fff' });
  } else {
    await Swal.fire({ icon: 'success', text: 'Username updated successfully!', background: '#1e1e1f', color: '#fff' });
    if (editSection) editSection.style.display = 'none';
    
    // Clear the input fields
    document.getElementById('confirm-password').value = '';
    document.getElementById('new-username').value = '';
    
    checkAccountStatus(); 
  }
  }

  // 3. Auth Navigation
  if (event.target.closest('#btn-start-auth')) {
    gCont.style.setProperty('display', 'none', 'important');
    aCont.style.setProperty('display', 'block', 'important');
  }

  if (event.target.closest('#btn-cancel-auth')) {
    aCont.style.setProperty('display', 'none', 'important');
    gCont.style.setProperty('display', 'block', 'important');
  }

  // 4. Login Action
  if (event.target.closest('#login-btn-final')) {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
  }

  // 5. Register Action (Fixed Username ID)
  if (event.target.closest('#register-btn-final')) {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-password');
    const nameInput = document.getElementById('auth-username'); // Menggunakan ID yang ada di index.html

    if (!emailInput.value || !passInput.value || !nameInput.value) {
      return Swal.fire({ icon: 'warning', text: 'All fields are required for registration', background: '#1e1e1f', color: '#fff' });
    }

if (nameInput.value.length > 12) {
      return Swal.fire({ icon: 'error', text: 'Username maximum is 12 characters', background: '#1e1e1f', color: '#fff' });
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
      Swal.fire({ icon: 'success', text: 'Registration successful! Check your email to verify.', background: '#1e1e1f', color: '#fff' });
    }
  }

  // 6. Reset Password Action (Linked to ID btn-forgot-pass or btn-reset-password)
  if (event.target.closest('#btn-forgot-pass') || event.target.closest('#btn-reset-password')) {
    const emailInput = document.getElementById('auth-email');
    
    if (!emailInput || !emailInput.value) {
      return Swal.fire({ icon: 'warning', text: 'Please enter your email first', background: '#1e1e1f', color: '#fff' });
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput.value, {
      redirectTo: window.location.href, 
    });

    if (error) {
      Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    } else {
      Swal.fire({ icon: 'success', text: 'Reset instructions sent to your email!', background: '#1e1e1f', color: '#fff' });
    }
  }

// Tambahkan ini di script.js
supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    // Tampilkan popup SweetAlert untuk input password baru
    const { value: newPassword } = await Swal.fire({
      title: 'Reset Your Password',
      input: 'password',
      inputLabel: 'Enter your new password',
      inputPlaceholder: 'New Password',
      showCancelButton: false,
      confirmButtonText: 'Update Password',
      background: '#1e1e1f',
      color: '#fff',
      inputAttributes: {
        autocapitalize: 'off',
        autocorrect: 'off'
      }
    });

    if (newPassword) {
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Swal.fire({ icon: 'error', text: error.message });
      } else {
        Swal.fire({ icon: 'success', text: 'Password updated successfully!' });
        // Redirect ke home atau login
        window.location.hash = ''; 
      }
    }
  }
});

  
  // 7. Logout Action
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
});

/**
 * UI ENGINE: Fetch Role & Persistent Login
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

    const { data: profileData } = await supabaseClient
      .from('profiles')
      .select('role, username, points') // Pastikan 'points' ikut diambil
      .eq('id', user.id)
      .single();

    const userRole = profileData?.role || 'Member';
    const displayName = profileData?.username || user.user_metadata.display_name || 'Member';
    
    // Simpan nilai poin dari database ke variabel
    const userPoints = profileData?.points || 0; 

    const date = new Date(user.created_at).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

        if (display) {
      display.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
          <div style="background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet); grid-column: span 2;">
            <h4 class="h4" style="font-size: 24px; color: var(--white-1); margin-bottom: 4px;">
              ${displayName}
            </h4>
            <p style="font-size: 14px; color: var(--light-gray); margin-bottom: 8px;">${user.email}</p>
            <div style="border-top: 1px solid var(--jet); padding-top: 8px; font-size: 11px; color: var(--light-gray-70);">
              Joined: ${date}
            </div>
          </div>

          <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Points</p>
            <p style="font-size: 20px; font-weight: 600; color: #fff;">${userPoints}</p>
          </div>

          <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Role</p>
            <p style="font-size: 20px; font-weight: 600; color: #fff;">${userRole}</p>
          </div>
        </div>
      `;
    }
    
    if (window.currentBlogId) loadComments(window.currentBlogId);
  } else {
    if (guest) guest.style.display = 'block';
  }
}

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
    formArea.innerHTML = `<p style="color: var(--orange-yellow-crayola); font-size: 14px; margin-bottom: 30px;">Please login to join the conversation.</p>`;
  } else {
    formArea.innerHTML = `
      <textarea id="comment-input" class="form-input" placeholder="Write your comment..." required style="min-height: 80px; margin-bottom: 15px; resize: vertical;"></textarea>
      <button class="form-btn" onclick="postComment()" style="width: max-content; padding: 10px 20px;">
        <ion-icon name="paper-plane-outline"></ion-icon><span>Post Comment</span>
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
  const username = c.profiles?.username || 'Anonymous';
  const role = c.profiles?.role || 'Member';
  const email = c.profiles?.email || 'No Email';
  const isOwner = currentUser && currentUser.id === c.user_id;
  const isAdmin = currentUser && currentUser.role === 'Admin';

  return `
    <div class="comment-item" style="margin-bottom: 30px; background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div>
<h4 class="h4" style="font-size: 16px; color: var(--white-1); margin: 0;">${username}</h4>
<p style="font-size: 12px; color: var(--light-gray-70); margin: 2px 0 8px;">${email}</p>
</div>

<div style="text-align: right;">
  <span style="display: block; font-size: 10px; color: var(--white-1); text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 4px;">
    ${role}
  </span>
  
  <span style="font-size: 10px; color: var(--light-gray-70);">
    ${new Date(c.created_at).toLocaleString('id-ID', {
      hour: '2-digit', 
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })}

</span>
        </div>
      </div>
      <div style="border-top: 1px solid var(--jet); margin-bottom: 15px;"></div>
      <p style="font-size: 15px; color: var(--light-gray); line-height: 1.6; margin-bottom: 15px;">
        ${c.content}
      </p>
      ${(isOwner || currentUser?.role === 'Admin' || currentUser?.role === 'Owner') ? `
<button onclick="deleteComment('${c.id}')" style="color: #ff5f5f; font-size: 12px; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 5px; padding: 0;">
  <ion-icon name="trash-outline" style="color: #ff5f5f !important;"></ion-icon> 
  Delete Comment
</button>
      ` : ''}

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

  const { data: comments, error } = await supabaseClient
    .from('comments')
    .select(`id, content, created_at, user_id, profiles (username, role, email)`)
    .eq('post_id', blogId)
    .order('created_at', { ascending: false });

  if (error) return;
  if (!comments || comments.length === 0) {
    displayList.innerHTML = `<p style="color: var(--light-gray-70); text-align: center;">No comments yet.</p>`;
  } else {
    displayList.innerHTML = comments.map(c => renderCommentHTML(c, currentUserData)).join('');
  }
};

window.postComment = async function() {
  const input = document.getElementById('comment-input');
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user || !input.value.trim()) return;
  const { error } = await supabaseClient
    .from('comments')
    .insert([{ post_id: window.currentBlogId, user_id: user.id, content: input.value.trim() }]);
  if (error) return Swal.fire({ icon: 'error', text: 'Failed to post comment' });
  input.value = ''; 
  loadComments(window.currentBlogId);
};

window.deleteComment = async function(commentId) {
  const result = await Swal.fire({
    text: "Delete this comment?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ff5f5f',
    background: '#1e1e1f',
    color: '#fff'
  });
  if (result.isConfirmed) {
    const { error } = await supabaseClient.from('comments').delete().eq('id', commentId);
    if (error) Swal.fire({ icon: 'error', text: "Failed to delete" });
    else loadComments(window.currentBlogId);
  }
};

/**
 * INITIALIZATION
 */
supabaseClient.auth.onAuthStateChange(() => {
  checkAccountStatus();
});

document.addEventListener("DOMContentLoaded", () => {
  checkAccountStatus();
});


/**
 * LEADERBOARD SYSTEM (3 DATA TERATAS + SEE MORE)
 */
let isLeaderboardExpanded = false; 

async function loadLeaderboard() {
  const listContainer = document.getElementById('leaderboard-list');
  if (!listContainer) return;

  listContainer.innerHTML = '<p style="text-align:center; color:var(--light-gray); padding:20px;">Loading leaderboard...</p>';

  try {
    const { data: users, error: dbError } = await supabaseClient
      .from('profiles')
      .select('id, username, email, points, role, created_at, last_seen')
      .order('points', { ascending: false });

    if (dbError) throw dbError;
    if (!users || users.length === 0) {
      listContainer.innerHTML = '<p style="text-align:center; color:var(--light-gray); padding:20px;">Belum ada data member.</p>';
      return;
    }

    let isAdmin = false;
    let currentUserId = null;
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentUserId = session.user.id;
      const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
      const r = profile?.role?.toLowerCase();
      if (r === 'admin' || r === 'owner') isAdmin = true;
    }

    const displayUsers = isLeaderboardExpanded ? users : users.slice(0, 3);

        let htmlContent = displayUsers.map((user, index) => {
      const isTop3 = index < 3;
      const rankColor = isTop3 ? '#ffffff' : 'var(--white-1)';
      
      const isAdminRole = user.role?.toLowerCase() === 'admin';
      const isOwnerRole = user.role?.toLowerCase() === 'owner';
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isOnline = user.last_seen && new Date(user.last_seen) > fiveMinAgo ? 'online' : 'offline';

      return `
        <div class="leaderboard-item" 
             onclick="showUserStats('${user.username || 'Anonymous'}', '${user.role || 'Member'}', ${user.points || 0}, ${index + 1}, '${user.email || ''}', '${user.created_at || ''}', '${user.id}', '${isOnline}')"
             style="background: var(--onyx); padding: 20px; border-radius: 14px; border: 1px solid ${isOwnerRole ? 'rgba(255,255,255,0.3)' : 'var(--jet)'}; display: flex; align-items: center; gap: 15px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease; ${isOwnerRole ? 'box-shadow: 0 0 0 1px rgba(255,255,255,0.1);' : ''}">
          <div style="display: flex; flex-direction: column; align-items: center; min-width: 45px; gap: 4px;">
            <div style="width: 45px; height: 45px; background: var(--jet); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: ${rankColor}; border: 1px solid ${isTop3 ? '#ffffff' : 'transparent'};">
              ${index + 1}
            </div>
            ${isOwnerRole ? `
              <span style="font-size: 9px; color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(255,255,255,0.15); padding: 1px 5px; border-radius: 4px;">Owner</span>
            ` : isAdminRole ? `
              <span style="font-size: 9px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Admin</span>
            ` : ''}
          </div>
          
          <div style="flex-grow: 1; min-width: 0;"> 
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
              <h4 class="h4" style="font-size: 16px; color: var(--white-1); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${user.username || 'Anonymous'}
              </h4>
              <span title="${isOnline === 'online' ? 'Online' : 'Offline'}" style="display:inline-block; flex-shrink:0; width:8px; height:8px; border-radius:50%; background:${isOnline === 'online' ? '#4caf50' : '#555'}; ${isOnline === 'online' ? 'box-shadow:0 0 5px #4caf50;' : ''}"></span>
            </div>
            <p style="font-size: 12px; color: var(--light-gray-70); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">
              ${user.email || 'No Email'}
            </p>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 80px;">
            <div style="background: var(--jet); min-width: 70px; height: 45px; border-radius: 10px; border: 1px solid var(--white-1); display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 9px; color: var(--light-gray-70); text-transform: uppercase; line-height: 1;">Pts</span>
              <span style="font-weight: 700; color: var(--white-1); font-size: 16px; line-height: 1.2;">${user.points || 0}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');



    if (users.length > 3) {
      // Desain tombol redup (outline gelap) tapi tulisan tetap putih terang
      htmlContent += `
        <div style="text-align: center; margin-top: 15px;">
          <button onclick="toggleLeaderboard()" class="form-btn" 
            style="margin: 0 auto; 
                   padding: 10px 25px; 
                   background: transparent; 
                   border: 1px solid var(--jet); 
                   color: #ffffff; 
                   font-size: 13px;
                   opacity: 0.8;">
            <span>${isLeaderboardExpanded ? 'See Less' : 'See More'}</span>
            <ion-icon name="${isLeaderboardExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}"></ion-icon>
          </button>
        </div>
      `;
    }


    listContainer.innerHTML = htmlContent;
  } catch (err) {
    listContainer.innerHTML = `<p style="text-align:center; color:#ff5f5f; padding:20px;">Error: ${err.message}</p>`;
  }
}

window.toggleLeaderboard = function() {
  isLeaderboardExpanded = !isLeaderboardExpanded;
  loadLeaderboard();
};

document.querySelectorAll("[data-nav-link]").forEach(link => {
  link.addEventListener("click", function() {
    const tabName = this.innerText.toLowerCase().trim();
    if (tabName === "event") {
      isLeaderboardExpanded = false; 
      loadLeaderboard();
    }
  });
});



/**
 * FUNGSI UPDATE POINTS (WAJIB GLOBAL)
 * Menggunakan window agar bisa dipanggil oleh onclick di HTML
 */
window.updatePoints = async function(userId, username, currentPoints) {
  console.log("Mencoba update poin untuk:", username); // Untuk cek di console F12

  const { value: newPoints } = await Swal.fire({
    title: `Update Points: ${username}`,
    input: 'number',
    inputValue: currentPoints,
    background: '#1e1e1f',
    color: '#fff',
    confirmButtonColor: '#ffdb70',
    showCancelButton: true,
    confirmButtonText: 'Save',
    cancelButtonText: 'Cancel'
  });

  if (newPoints !== undefined && newPoints !== null && newPoints !== "") {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ points: parseInt(newPoints) })
        .eq('id', userId);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${username}'s points have been updated to ${newPoints}`,
        background: '#1e1e1f',
        color: '#fff',
        timer: 1500,
        showConfirmButton: false
      });


      // Refresh table data after successful update
      if (typeof loadLeaderboard === 'function') {
        loadLeaderboard();
      }
      
    } catch (err) {
      console.error("Update failed:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        background: '#1e1e1f',
        color: '#fff'
      });
    }
  }
};


// Listener untuk memantau perubahan data profil secara realtime
supabaseClient
  .channel('profile-update')
  .on('postgres_changes', { 
    event: 'UPDATE', 
    schema: 'public', 
    table: 'profiles' 
  }, (payload) => {
    // Jika data yang berubah adalah milik user yang sedang login, refresh tampilan profil
    supabaseClient.auth.getUser().then(({ data: { user } }) => {
      if (user && payload.new.id === user.id) {
        checkAccountStatus();
      }
    });
  })
  .subscribe();

/**
 * QnA ACCORDION SYSTEM (SLIDE EFFECT)
 */
const qnaButtons = document.querySelectorAll('.qna-btn');

qnaButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    const parent = this.parentElement;
    
    // Toggle class active pada item yang diklik
    parent.classList.toggle('active');
    
    // Opsional: Tutup pertanyaan lain jika satu dibuka (Mode tunggal)
    document.querySelectorAll('.qna-item').forEach(item => {
      if (item !== parent) {
        item.classList.remove('active');
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", function() {
  const popup = document.getElementById('join-popup');
  const closeBtn = document.getElementById('close-popup');

  // Munculkan bar setelah 2 detik agar tidak mengejutkan
  setTimeout(() => {
    popup.classList.add('active');
  }, 2000);

  // Fungsi tutup
  closeBtn.addEventListener('click', () => {
    popup.classList.remove('active');
  });

  // Otomatis hilang setelah 10 detik (opsional, agar tidak mengganggu terus)
  setTimeout(() => {
    popup.classList.remove('active');
  }, 12000);
});

/**
 * TAMPILKAN STATISTIK USER DARI LEADERBOARD
 */
window.showUserStats = async function(username, role, points, rank, email, createdAt, userId, onlineStatus) {
  // Check if current logged-in user is admin or owner
  let isAdmin = false;
  let isOwner = false;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
    const currentRole = profile?.role?.toLowerCase();
    if (currentRole === 'admin') isAdmin = true;
    if (currentRole === 'owner') { isOwner = true; isAdmin = true; } // owner also has admin power
  }

  const joinDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Unknown';

  const isOnline = onlineStatus === 'online';
  const statusDot = isOnline
    ? `<span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#4caf50; margin-right:6px; box-shadow: 0 0 5px #4caf50;"></span>`
    : `<span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:#888; margin-right:6px;"></span>`;
  const statusLabel = isOnline ? 'Online' : 'Offline';
  const statusColor = isOnline ? '#4caf50' : '#888';

  const targetIsAdmin = role?.toLowerCase() === 'admin';
  const targetIsOwner = role?.toLowerCase() === 'owner';

  // Edit Points button (admin & owner) - centered
  const editPointsBtn = (isAdmin || isOwner) ? `
    <div style="text-align: center; margin-top: 12px;">
      <button onclick="Swal.close(); setTimeout(() => updatePoints('${userId}', '${username}', ${points}), 200);"
        style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.08); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.5px; transition: all 0.2s; width: 100%;">
          Edit Points
      </button>
    </div>
  ` : '';

  // Toggle Admin button (owner only, can't demote owner)
  const toggleAdminBtn = isOwner && !targetIsOwner ? `
    <div style="text-align: center; margin-top: 8px;">
      <button onclick="Swal.close(); setTimeout(() => toggleAdminRole('${userId}', '${username}', '${role}'), 200);"
        style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 10px; border: 1px solid ${targetIsAdmin ? 'rgba(255,95,95,0.35)' : 'rgba(100,200,100,0.35)'}; background: ${targetIsAdmin ? 'rgba(255,95,95,0.08)' : 'rgba(100,200,100,0.08)'}; color: ${targetIsAdmin ? '#ff7f7f' : '#7fdf7f'}; font-size: 13px; font-weight: 600; cursor: pointer; letter-spacing: 0.5px; transition: all 0.2s; width: 100%;">
        ${targetIsAdmin ? '🔻 Remove Admin' : '🛡️ Make Admin'}
      </button>
    </div>
  ` : '';

  Swal.fire({
    html: `
      <div style="text-align: center; padding-bottom: 6px;">

        <!-- Avatar / Rank Badge -->
        <div style="width: 64px; height: 64px; background: var(--jet); border-radius: 16px; border: 2px solid var(--white-1); display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; color: #fff; margin: 0 auto 14px;">
          #${rank}
        </div>

        <!-- Username -->
        <h3 style="color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 4px;">${username}</h3>

        <!-- Role -->
        <p style="color: var(--light-gray-70); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 10px;">${role}</p>

        <!-- Online Status Badge -->
        <div style="display: inline-flex; align-items: center; background: var(--jet); padding: 5px 14px; border-radius: 20px; font-size: 12px; color: ${statusColor}; font-weight: 600; margin-bottom: 20px;">
          ${statusDot}${statusLabel}
        </div>

        <div style="border-top: 1px solid var(--jet); margin-bottom: 16px;"></div>

        <!-- Stats Grid -->
        <div style="display: flex; flex-direction: column; gap: 10px; text-align: center;">

          <div style="background: var(--onyx); padding: 14px 20px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="color: var(--light-gray-70); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Total Points</p>
            <p style="color: #fff; font-size: 22px; font-weight: 700; margin: 0;">${points}</p>
          </div>

          <div style="background: var(--onyx); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="color: var(--light-gray-70); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Email</p>
            <p style="color: #fff; font-size: 13px; font-weight: 500; margin: 0; word-break: break-all;">${email || '—'}</p>
          </div>

          <div style="background: var(--onyx); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--jet);">
            <p style="color: var(--light-gray-70); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Joined</p>
            <p style="color: #fff; font-size: 13px; font-weight: 500; margin: 0;">${joinDate}</p>
          </div>

        </div>

        ${editPointsBtn}
        ${toggleAdminBtn}

      </div>
    `,
    background: '#1e1e1f',
    showConfirmButton: true,
    confirmButtonText: '<span style="color: #1a1a1a; font-weight: 600;">Close</span>',
    confirmButtonColor: '#ffffff',
    customClass: {
      popup: 'swal-monochrome-popup'
    }
  });
};

/**
 * TOGGLE ADMIN ROLE (OWNER ONLY)
 */
window.toggleAdminRole = async function(userId, username, currentRole) {
  const isCurrentlyAdmin = currentRole?.toLowerCase() === 'admin';
  const newRole = isCurrentlyAdmin ? 'Member' : 'Admin';
  const actionText = isCurrentlyAdmin ? 'Remove Admin from' : 'Make Admin';

  const result = await Swal.fire({
    title: `${actionText} ${username}?`,
    text: isCurrentlyAdmin
      ? `${username} will be demoted to Member.`
      : `${username} will be promoted to Admin and can manage leaderboard points.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: isCurrentlyAdmin ? '#ff5f5f' : '#4caf50',
    cancelButtonColor: '#444',
    confirmButtonText: isCurrentlyAdmin ? 'Yes, Remove Admin' : 'Yes, Make Admin',
    background: '#1e1e1f',
    color: '#fff'
  });

  if (result.isConfirmed) {
    try {
      const { error } = await supabaseClient
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Role Updated!',
        text: `${username} is now ${newRole}.`,
        background: '#1e1e1f',
        color: '#fff',
        timer: 1800,
        showConfirmButton: false
      });

      if (typeof loadLeaderboard === 'function') loadLeaderboard();

    } catch (err) {
      Swal.fire({ icon: 'error', text: err.message, background: '#1e1e1f', color: '#fff' });
    }
  }
};

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
 * Filter & Custom Select (Hanya jalan jika elemennya ada)
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
 * Contact Form Validation
 */
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

if (form) {
  for (let i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener("input", function () {
      if (form.checkValidity()) {
        formBtn.removeAttribute("disabled");
      } else {
        formBtn.setAttribute("disabled", "");
      }
    });
  }
}

/**
 * Page Navigation (Perbaikan Utama)
 */
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    // Gunakan innerText dan trim() agar spasi di HTML tidak merusak pencarian
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
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoYm1mc3J3cGVieXVuanh4bWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NzkzOTksImV4cCI6MjA5MjA1NTM5OX0.EiFkHOoS2kegWrmPG9BP_nSaBqV3FKWbTZF-jWJupe0'; // Gunakan key lengkapmu
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * AUTH & NAVIGATION LOGIC
 */
window.addEventListener('click', async function(event) {
  const gCont = document.getElementById('guest-container');
  const aCont = document.getElementById('auth-container');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');
  const userInput = document.getElementById('auth-username');

  // Switch to Auth View
  if (event.target.closest('#btn-start-auth')) {
    gCont.style.setProperty('display', 'none', 'important');
    aCont.style.setProperty('display', 'block', 'important');
  }

  // Switch back to Guest View
  if (event.target.closest('#btn-cancel-auth')) {
    aCont.style.setProperty('display', 'none', 'important');
    gCont.style.setProperty('display', 'block', 'important');
  }

  // LOGIN ACTION
  if (event.target.closest('#login-btn-final')) {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email: emailInput.value,
      password: passInput.value
    });
    if (error) Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    else checkAccountStatus();
  }

  // REGISTER ACTION
  if (event.target.closest('#register-btn-final')) {
    if (!userInput.value) return Swal.fire({ icon: 'warning', text: 'Please enter a username' });
    const { error } = await supabaseClient.auth.signUp({
      email: emailInput.value,
      password: passInput.value,
      options: { data: { display_name: userInput.value } }
    });
    if (error) Swal.fire({ icon: 'error', text: error.message, background: '#1e1e1f', color: '#fff' });
    else Swal.fire({ icon: 'success', text: 'Registration successful! Please login.', background: '#1e1e1f', color: '#fff' });
  }

  // FORGOT PASSWORD ACTION
  if (event.target.closest('#btn-forgot-pass')) {
    if (!emailInput.value) return Swal.fire({ icon: 'info', text: 'Please enter your email first.' });
    const { error } = await supabaseClient.auth.resetPasswordForEmail(emailInput.value);
    if (error) Swal.fire({ icon: 'error', text: error.message });
    else Swal.fire({ icon: 'success', text: 'Reset link sent to your email!' });
  }

  // LOGOUT ACTION
  if (event.target.closest('#logout-btn-final')) {
    await supabaseClient.auth.signOut();
    location.reload();
  }
  
  // UPDATE USERNAME ACTION
  if (event.target.closest('#btn-update-name')) {
    const newName = document.getElementById('new-username').value;
    const { error } = await supabaseClient.auth.updateUser({ data: { display_name: newName } });
    if (error) Swal.fire({ icon: 'error', text: error.message });
    else {
      Swal.fire({ icon: 'success', text: 'Username updated!' });
      checkAccountStatus();
    }
  }
});

/**
 * UI ENGINE: Fix Overlapping & Color Updates
 */
async function checkAccountStatus() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  
  const guest = document.getElementById('guest-container');
  const auth = document.getElementById('auth-container');
  const profile = document.getElementById('profile-container');
  const display = document.getElementById('user-info-display');

  // Sembunyikan semua dulu agar tidak bertumpuk
  if (guest) guest.style.display = 'none';
  if (auth) auth.style.display = 'none';
  if (profile) profile.style.display = 'none';

  if (user) {
    if (profile) profile.style.display = 'block';

    const date = new Date(user.created_at).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    // Template Stats (Warna Points jadi Kuning)
    display.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
        <div style="background: var(--onyx); padding: 20px; border-radius: 12px; border: 1px solid var(--jet); grid-column: span 2;">
          <h4 class="h4" style="font-size: 24px; color: var(--orange-yellow-crayola); margin-bottom: 4px;">
            ${user.user_metadata.display_name || 'Member'}
          </h4>
          <p style="font-size: 14px; color: var(--light-gray); margin-bottom: 8px;">${user.email}</p>
          <div style="border-top: 1px solid var(--jet); padding-top: 8px; font-size: 11px; color: var(--light-gray-70);">
            Joined: ${date}
          </div>
        </div>
        
        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
          <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Points</p>
          <p style="font-size: 20px; font-weight: 600; color: #fbbf24;">0</p>
        </div>

        <div style="background: var(--onyx); padding: 15px; border-radius: 12px; border: 1px solid var(--jet);">
          <p style="font-size: 10px; color: var(--light-gray); text-transform: uppercase;">Role</p>
          <p style="font-size: 20px; font-weight: 600; color: #fbbf24;">Member</p>
        </div>
      </div>
    `;
  } else {
    if (guest) guest.style.display = 'block';
  }
}

/**
 * HANDLERS: Edit Username & Security
 */
window.addEventListener('click', async function(event) {
  const editSection = document.getElementById('edit-username-section');

  // Toggle form edit
  if (event.target.closest('#btn-show-edit')) {
    editSection.style.display = editSection.style.display === 'none' ? 'block' : 'none';
  }

  // Submit Update Username
  if (event.target.closest('#btn-submit-username')) {
    const password = document.getElementById('confirm-password').value;
    const newName = document.getElementById('new-username').value;
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!password || !newName) {
      return Swal.fire({ icon: 'warning', text: 'Please fill all fields', background: '#1e1e1f', color: '#fff' });
    }

    // 1. Re-verify password
    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: password
    });

    if (authError) {
      return Swal.fire({ icon: 'error', text: 'Incorrect password verification', background: '#1e1e1f', color: '#fff' });
    }

    // 2. Update Metadata
    const { error: updateError } = await supabaseClient.auth.updateUser({
      data: { display_name: newName }
    });

    if (updateError) {
      Swal.fire({ icon: 'error', text: updateError.message });
    } else {
      await Swal.fire({ icon: 'success', text: 'Profile updated!', background: '#1e1e1f', color: '#fff' });
      editSection.style.display = 'none'; // Sembunyikan form

      checkAccountStatus(); // Segarkan tampilan
    }
  }
});

/**
 * BLOG & COMMENT SYSTEM
 */

// Global variable to store current active blog ID
window.currentBlogId = null;

// 1. Show Blog Detail
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

// 2. Close Blog Detail
window.closeBlogDetail = function() {
  window.currentBlogId = null;
  document.getElementById('blog-list-container').style.display = 'block';
  document.getElementById('blog-detail-container').style.display = 'none';
};

// 3. Render Comment HTML
window.renderCommentHTML = function(c) {
  const username = c.profiles?.username || 'Anonymous';
  const role = c.profiles?.role || 'Member';
  const email = c.profiles?.email || 'No Email';
  
  return `
    <div class="comment-item" style="margin-bottom: 25px;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <h4 class="h4" style="font-size: 16px; color: var(--orange-yellow-crayola); margin: 0;">${username}</h4>
        <span style="font-size: 13px; color: var(--light-gray-70);">${email}</span>
      </div>
      
      <p style="font-size: 15px; color: var(--light-gray); margin-bottom: 12px; line-height: 1.6;">
        ${c.content}
      </p>

      <div style="border-top: 1px solid var(--jet); padding-top: 8px; display: flex; gap: 15px; align-items: center;">
        <span style="font-size: 11px; color: #fbbf24; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">
          ${role}
        </span>
        <span style="font-size: 11px; color: var(--light-gray-70);">${new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    </div>
  `;
};

// 4. Load Comments from Supabase
window.loadComments = async function(blogId) {
  const displayList = document.getElementById('comments-display-list');
  
  const { data: comments, error } = await supabaseClient
    .from('comments')
    .select(`
      content,
      created_at,
      profiles (
        username,
        role,
        email
      )
    `)
    .eq('post_id', blogId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error loading comments:", error);
    return;
  }

  if (!comments || comments.length === 0) {
    displayList.innerHTML = `<p style="color: var(--light-gray-70); text-align: center;">No comments yet. Be the first to comment!</p>`;
  } else {
    displayList.innerHTML = comments.map(c => renderCommentHTML(c)).join('');
  }
};

// 5. Post Comment to Supabase
window.postComment = async function() {
  const input = document.getElementById('comment-input');
  const content = input?.value;
  
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) return;
  
  if (!content || content.trim() === '') {
    return Swal.fire({ 
      icon: 'warning', 
      text: 'Comment cannot be empty', 
      background: '#1e1e1f', 
      color: '#fff' 
    });
  }

  const { error } = await supabaseClient
    .from('comments')
    .insert([
      { 
        post_id: window.currentBlogId, 
        user_id: user.id, 
        content: content.trim() 
      }
    ]);

  if (error) {
    console.error("Database Error:", error);
    return Swal.fire({ 
      icon: 'error', 
      title: 'Failed to send',
      text: 'Make sure your profile is registered in the database.',
      background: '#1e1e1f', 
      color: '#fff' 
    });
  }

  input.value = ''; 
  await loadComments(window.currentBlogId);
  
  Swal.fire({ 
    icon: 'success', 
    text: 'Comment posted successfully!', 
    background: '#1e1e1f', 
    color: '#fff', 
    timer: 1500, 
    showConfirmButton: false 
  });
};
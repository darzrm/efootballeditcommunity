'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let isSignUpMode = false;
let idToDelete = null;

// UI CONTROL
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const accContent = document.getElementById('account-content');
    if (!accContent) return;

    if (session) {
        const username = localStorage.getItem('eec_username') || session.user.email.split('@')[0];
        const crown = (username === 'dariraa') ? '<ion-icon name="medal" style="color:#ffdb70"></ion-icon>' : '';
        
        accContent.innerHTML = `
            <div class="profile-icon"><ion-icon name="person-circle"></ion-icon></div>
            <h3 class="h3">${username} ${crown}</h3>
            <p class="blog-text" style="margin-bottom:20px;">${session.user.email}</p>
            <div style="display:grid; gap:10px;">
                <button class="form-btn" onclick="handleChangeUsername()">Change Username</button>
                <button class="form-btn secondary" onclick="handleSignOut()">Logout</button>
            </div>
        `;
        document.getElementById('comment-form').style.display = 'block';
        document.getElementById('login-warn').style.display = 'none';
    } else {
        accContent.innerHTML = `
            <h3 class="h3">Not Logged In</h3>
            <p class="blog-text" style="margin: 15px 0;">Join EEC to comment and participate in events.</p>
            <button class="form-btn" onclick="openAuthModal()">Login / Sign Up</button>
        `;
        document.getElementById('comment-form').style.display = 'none';
        document.getElementById('login-warn').style.display = 'block';
    }
};

// AUTH ACTIONS
window.openAuthModal = () => document.getElementById('custom-auth-modal').classList.add('active');
window.closeAuthModal = () => document.getElementById('custom-auth-modal').classList.remove('active');

window.handleSignOut = async () => {
    await _supabase.auth.signOut();
    localStorage.removeItem('eec_username');
    location.reload();
};

window.handleChangeUsername = () => {
    const current = localStorage.getItem('eec_username') || "User";
    const newName = prompt("Enter new username:", current);
    if (newName) {
        localStorage.setItem('eec_username', newName);
        location.reload();
    }
};

// BLOG ACTIONS
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    const detail = document.getElementById('blog-content-detail');
    detail.innerHTML = `<h3 class="h3">Hello from EEC</h3><p class="blog-text">Welcome to the community!</p>`;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

// COMMENT SYSTEM
const loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = (localStorage.getItem('eec_username') === 'dariraa');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: false });

    display.innerHTML = data?.map(c => `
        <div class="comment-card" style="margin-bottom:15px; padding:15px; background:var(--onyx); border-radius:12px; border-left:3px solid var(--orange-yellow-crayola);">
            ${isAdmin ? `<button onclick="triggerDelete('${c.id}')" style="float:right; color:#ff4b4b; background:none; border:1px solid #ff4b4b; border-radius:4px; padding:2px 5px; font-size:10px;">Delete</button>` : ''}
            <p style="color:var(--orange-yellow-crayola); font-weight:600;">${c.username} ${c.username === 'dariraa' ? '🏅' : ''}</p>
            <p class="blog-text" style="font-size:14px; margin-top:5px;">${c.content}</p>
        </div>
    `).join('') || '<p class="blog-text">No comments yet.</p>';
};

window.triggerDelete = (id) => {
    idToDelete = id;
    document.getElementById('confirm-modal').classList.add('active');
};

window.closeConfirmModal = () => {
    document.getElementById('confirm-modal').classList.remove('active');
    idToDelete = null;
};

// DOM READY
document.addEventListener("DOMContentLoaded", () => {
    updateUI();

    // Modal Switch
    document.getElementById('switch-auth-mode').onclick = () => {
        isSignUpMode = !isSignUpMode;
        document.getElementById('auth-modal-title').innerText = isSignUpMode ? "Sign Up" : "Login";
        document.getElementById('modal-username').style.display = isSignUpMode ? "block" : "none";
    };

    // Modal Submit
    document.getElementById('modal-submit-btn').onclick = async () => {
        const email = document.getElementById('modal-email').value;
        const pass = document.getElementById('modal-pass').value;
        const user = document.getElementById('modal-username').value;

        if (isSignUpMode) {
            const { error } = await _supabase.auth.signUp({ email, password: pass });
            if (error) return alert(error.message);
            localStorage.setItem('eec_username', user || email.split('@')[0]);
        } else {
            const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
            if (error) return alert("Error: " + error.message);
        }
        location.reload();
    };

    // Delete Action
    document.getElementById('confirm-yes').onclick = async () => {
        if (!idToDelete) return;
        const { error } = await _supabase.from('comments').delete().eq('id', idToDelete);
        if (!error) {
            closeConfirmModal();
            loadComments('hello-eec');
        }
    };

    // Comment Submit
    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        const user = localStorage.getItem('eec_username') || session.user.email.split('@')[0];

        await _supabase.from('comments').insert([{
            content: input.value,
            user_id: session.user.id,
            username: user,
            blog_id: 'hello-eec'
        }]);
        input.value = '';
        loadComments('hello-eec');
    };

    // Nav Logic
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
        }
    });

    // Sidebar
    document.querySelector("[data-sidebar-btn]").onclick = () => document.querySelector("[data-sidebar]").classList.toggle("active");
});

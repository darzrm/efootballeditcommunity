'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let currentSession = null;

// Unified Modal Logic
window.showModal = (title, bodyHTML, onConfirm) => {
    const modal = document.getElementById('global-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    const confirmBtn = document.getElementById('modal-confirm-btn');
    
    confirmBtn.onclick = async () => {
        await onConfirm();
        closeGlobalModal();
    };
    modal.classList.add('active');
};

window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

// Account UI Refresh
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    currentSession = session;
    const accContent = document.getElementById('account-content');
    if (!accContent) return;

    if (session) {
        const username = localStorage.getItem('eec_username') || "Member";
        const isAdmin = (username === 'dariraa');
        const badge = isAdmin ? '<i data-lucide="crown" class="admin-badge"></i>' : '';

        accContent.innerHTML = `
            <div class="profile-icon"><i data-lucide="user-circle" style="width:60px; height:60px;"></i></div>
            <h3 class="h3" style="display:flex; justify-content:center; align-items:center; gap:8px;">${username} ${badge}</h3>
            <p class="blog-text" style="opacity:0.7;">${session.user.email}</p>
            <div style="display:grid; gap:10px; max-width:250px; margin:20px auto 0;">
                <button class="form-btn" onclick="openEditProfile()">Edit Username</button>
                <button class="form-btn secondary" onclick="handleLogout()">Logout</button>
            </div>
        `;
        document.getElementById('comment-form').style.display = 'block';
    } else {
        accContent.innerHTML = `
            <h3 class="h3">Welcome to EEC</h3>
            <p class="blog-text">Please login to join our community.</p>
            <button class="form-btn" style="margin:20px auto 0;" onclick="openLoginModal()">Login / Register</button>
        `;
        document.getElementById('comment-form').style.display = 'none';
    }
    lucide.createIcons();
};

// Auth Actions with Modal
window.openLoginModal = () => {
    const body = `
        <input type="email" id="m-email" class="form-input" placeholder="Email">
        <input type="password" id="m-pass" class="form-input" placeholder="Password">
        <input type="text" id="m-user" class="form-input" placeholder="Username (for Sign Up)">
        <p class="blog-text" style="font-size:11px;">Note: Use email & pass to login, or fill all to register.</p>
    `;
    showModal("Login / Register", body, async () => {
        const email = document.getElementById('m-email').value;
        const pass = document.getElementById('m-pass').value;
        const user = document.getElementById('m-user').value;

        // Try Login first
        const { data, error: lErr } = await _supabase.auth.signInWithPassword({ email, password: pass });
        if (lErr) {
            // If login fails, try Sign Up
            const { error: sErr } = await _supabase.auth.signUp({ email, password: pass });
            if (sErr) alert(sErr.message);
            else {
                localStorage.setItem('eec_username', user || "Member");
                alert("Account created! Please login.");
            }
        } else {
            location.reload();
        }
    });
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    location.reload();
};

window.openEditProfile = () => {
    showModal("Edit Username", `<input type="text" id="new-username" class="form-input" placeholder="New Username">`, async () => {
        const val = document.getElementById('new-username').value;
        if (val) {
            localStorage.setItem('eec_username', val);
            if (currentSession) {
                await _supabase.from('comments').update({ username: val }).eq('user_id', currentSession.user.id);
            }
            location.reload();
        }
    });
};

// Comments Logic
const loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const currentUsername = localStorage.getItem('eec_username');
    const isAdmin = (currentUsername === 'dariraa');

    const { data, error } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: false });

    if (data) {
        display.innerHTML = data.map(c => {
            const canDelete = isAdmin || (session && session.user.id === c.user_id);
            const userBadge = (c.username === 'dariraa') ? '<i data-lucide="crown" class="admin-badge"></i>' : '';
            
            return `
                <div class="comment-card">
                    <div class="comment-header">
                        <div class="comment-info">
                            <span class="comment-user">${c.username} ${userBadge}</span>
                            <span class="comment-email">${c.email || 'Member'}</span>
                        </div>
                        ${canDelete ? `<button class="btn-delete" onclick="handleDelete('${c.id}')"><i data-lucide="trash-2" style="width:16px;"></i></button>` : ''}
                    </div>
                    <p class="comment-text">${c.content}</p>
                    <time class="comment-date">${new Date(c.created_at).toLocaleString('en-US')}</time>
                </div>
            `;
        }).join('');
        lucide.createIcons();
    }
};

window.handleDelete = async (id) => {
    if (confirm("Delete this comment permanently?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) loadComments('hello-eec');
        else alert("Failed to delete: " + error.message);
    }
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    lucide.createIcons();

    // Nav Logic
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
        }
    });

    // Sidebar Toggle
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn) sidebarBtn.onclick = () => document.querySelector("[data-sidebar]").classList.toggle("active");

    // Comment Form
    const cForm = document.getElementById('comment-form');
    if (cForm) {
        cForm.onsubmit = async (e) => {
            e.preventDefault();
            if (!currentSession) return;
            const input = document.getElementById('comment-input');
            const { error } = await _supabase.from('comments').insert([{
                content: input.value,
                user_id: currentSession.user.id,
                email: currentSession.user.email,
                username: localStorage.getItem('eec_username') || "Member",
                blog_id: 'hello-eec'
            }]);
            if (!error) { input.value = ''; loadComments('hello-eec'); }
        };
    }
});

// Blog Navigation
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    const detail = document.getElementById('blog-content-detail');
    detail.innerHTML = `<h3 class="h3">Hello from EEC</h3><p class="blog-text">Selamat datang di eFootball Edit Community. Ini adalah wadah bagi para desainer untuk berbagi karya dan teknik editing eFootball.</p>`;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

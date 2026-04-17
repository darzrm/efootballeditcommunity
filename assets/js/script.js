'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// Modal System
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
};
window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

// Account UI
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = localStorage.getItem('eec_username') || "Member";
        const isAdmin = (user === 'dariraa');
        container.innerHTML = `
            <div class="profile-icon"><i data-lucide="circle-user" style="width:80px; height:80px; color:var(--orange-yellow-crayola);"></i></div>
            <h3 class="h3" style="display:flex; align-items:center; gap:8px; justify-content:center;">
                ${user} ${isAdmin ? '<i data-lucide="crown" class="admin-badge"></i>' : ''}
            </h3>
            <p class="blog-text" style="opacity:0.6; margin-bottom:20px;">${session.user.email}</p>
            <div style="display:grid; gap:10px; width:100%; max-width:240px; margin:0 auto;">
                <button class="form-btn" onclick="openEditProfile()">Update Profile</button>
                <button class="form-btn secondary" onclick="handleLogout()">Logout</button>
            </div>
        `;
        document.getElementById('comment-form').style.display = 'block';
    } else {
        container.innerHTML = `
            <div class="profile-icon"><i data-lucide="shield-lock" style="width:60px; opacity:0.2;"></i></div>
            <h3 class="h3">Guest</h3>
            <button class="form-btn" style="margin-top:20px;" onclick="openAuth()">Login / Sign Up</button>
        `;
        document.getElementById('comment-form').style.display = 'none';
    }
    lucide.createIcons();
};

window.handleLogout = async () => { await _supabase.auth.signOut(); location.reload(); };

window.openAuth = () => {
    const html = `
        <div class="form-group">
            <input type="email" id="f-email" class="form-input" placeholder="Email Address">
            <input type="password" id="f-pass" class="form-input" placeholder="Password">
            <input type="text" id="f-user" class="form-input" placeholder="Username (Sign Up only)">
        </div>`;
    showModal("Account Access", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;
        const { error: lErr } = await _supabase.auth.signInWithPassword({ email, password: pass });
        if (lErr) {
            const { error: sErr } = await _supabase.auth.signUp({ email, password: pass });
            if (!sErr) { if(user) localStorage.setItem('eec_username', user); location.reload(); }
            else alert(sErr.message);
        } else { location.reload(); }
    });
};

window.openEditProfile = () => {
    showModal("Update Username", `<div class="form-group"><input type="text" id="f-new" class="form-input" placeholder="New Username"></div>`, async () => {
        const val = document.getElementById('f-new').value;
        if (val) {
            const { data: { session } } = await _supabase.auth.getSession();
            localStorage.setItem('eec_username', val);
            if (session) await _supabase.from('comments').update({ username: val }).eq('user_id', session.user.id);
            location.reload();
        }
    });
};

// Comments Logic
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = (localStorage.getItem('eec_username') === 'dariraa');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: false });

    list.innerHTML = data?.map(c => {
        const isOwner = (session && session.user.id === c.user_id);
        const date = new Date(c.created_at).toLocaleString('en-GB', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        
        return `
            <div class="comment-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div>
                        <span class="comment-username">${c.username} ${c.username === 'dariraa' ? '<i data-lucide="crown" class="admin-badge"></i>' : ''}</span>
                        <span style="font-size:10px; color:var(--light-gray-70);">${c.email || ''}</span>
                    </div>
                    ${(isAdmin || isOwner) ? `<button onclick="doDelete('${c.id}')" style="background:none; border:none; color:#ff4b4b; cursor:pointer;"><i data-lucide="trash-2" style="width:16px;"></i></button>` : ''}
                </div>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">${date}</time>
            </div>`;
    }).join('') || '<p class="blog-text">No comments yet.</p>';
    lucide.createIcons();
};

window.doDelete = async (id) => {
    if (confirm("Delete this comment?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) loadComments('hello-eec');
    }
};

// Init & Nav
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
        }
    });

    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        if (!session) return;
        await _supabase.from('comments').insert([{
            content: input.value, user_id: session.user.id,
            username: localStorage.getItem('eec_username') || "Member",
            email: session.user.email, blog_id: 'hello-eec'
        }]);
        input.value = ''; loadComments('hello-eec');
    };
});

window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    document.getElementById('blog-content-detail').innerHTML = `<h3 class="h3">Hello from EEC</h3><p class="blog-text">Wadah bagi para desainer eFootball untuk berbagi karya.</p>`;
    loadComments(id);
};
window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

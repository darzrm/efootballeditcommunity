'use strict';

/**
 * Supabase Configuration
 */
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * Global Modal System
 */
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
};
window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

/**
 * Account UI & Auth Logic
 */
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = localStorage.getItem('eec_username') || "Member";
        // Admin check berdasarkan email
        const isAdmin = (session.user.email === 'darzrm@gmail.com');
        
        container.innerHTML = `
            <div class="profile-icon"><i data-lucide="circle-user" style="width:80px; height:80px; color:var(--orange-yellow-crayola);"></i></div>
            <h3 class="h3" style="display:flex; align-items:center; gap:8px; justify-content:center;">
                ${user} ${isAdmin ? '<i data-lucide="crown" style="color:#ffdb70; width:20px;"></i>' : ''}
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
            <p class="blog-text">Login to join the community.</p>
            <button class="form-btn" style="margin-top:20px;" onclick="openAuth()">Login / Sign Up</button>
        `;
        document.getElementById('comment-form').style.display = 'none';
    }
    lucide.createIcons();
};

window.handleLogout = async () => { 
    await _supabase.auth.signOut(); 
    localStorage.removeItem('eec_username');
    location.reload(); 
};

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
            if (!sErr) { 
                if(user) localStorage.setItem('eec_username', user); 
                alert("Signup successful! Please login.");
                location.reload(); 
            } else alert(sErr.message);
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

/**
 * Comments Logic (WhatsApp Bubble Style)
 */
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    
    // Admin check berdasarkan email spesifik
    const isAdmin = (session?.user?.email === 'darzrm@gmail.com');

    const { data } = await _supabase.from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true }); // Ascending agar chat urut ke bawah

    list.innerHTML = data?.map(c => {
        const isMe = (session && session.user.id === c.user_id);
        const date = new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <div class="comment-user-box">
                    <div>
                        <span class="comment-username">${c.username}</span>
                        <span class="comment-email">${c.email || ''}</span>
                    </div>
                    ${(isAdmin || isMe) ? `
                        <button class="delete-btn" onclick="doDelete('${c.id}')">
                            <i data-lucide="trash-2" style="width:14px;"></i>
                        </button>` : ''}
                </div>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">${date}</time>
            </div>`;
    }).join('') || '<p class="blog-text" style="text-align:center;">No messages yet.</p>';
    
    lucide.createIcons();
    // Scroll otomatis ke bawah saat chat terbuka
    const container = document.querySelector('.comment-section');
    if (container) container.scrollTop = container.scrollHeight;
};

window.doDelete = async (id) => {
    if (confirm("Delete this message?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) loadComments('hello-eec');
        else alert("Failed: " + error.message);
    }
};

/**
 * Initialization & Navigation
 */
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    
    // Sidebar toggle mobile
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if(sidebarBtn) {
        sidebarBtn.onclick = () => document.querySelector("[data-sidebar]").classList.toggle("active");
    }

    // Navigation Tabs
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
            if(target === 'account') updateUI();
        }
    });

    // Submit Komentar
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.getElementById('comment-input');
            
            if (!session) return alert("Please login first!");

            await _supabase.from('comments').insert([{
                content: input.value, 
                user_id: session.user.id,
                username: localStorage.getItem('eec_username') || "Member",
                email: session.user.email, 
                blog_id: 'hello-eec'
            }]);
            
            input.value = ''; 
            loadComments('hello-eec');
        };
    }
});

/**
 * Blog Navigation
 */
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    
    const detail = document.getElementById('blog-content-detail');
    detail.innerHTML = `
        <h3 class="h3">Hello from EEC</h3>
        <p class="blog-text">Selamat datang di eFootball Edit Community. Wadah bagi para desainer eFootball untuk berbagi karya dan teknik editing.</p>
    `;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

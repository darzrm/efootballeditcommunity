'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// --- NOTIFICATION SYSTEM (High Contrast) ---
window.showNotif = (msg, icon = 'info') => {
    const old = document.querySelector('.eec-notif');
    if (old) old.remove();
    const notif = document.createElement('div');
    notif.className = 'eec-notif';
    notif.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
    document.body.appendChild(notif);
    lucide.createIcons();
    setTimeout(() => { notif.style.opacity = '0'; setTimeout(() => notif.remove(), 500); }, 3000);
};

// --- MODAL SYSTEM ---
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
};
window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

// --- ACCOUNT UI (English & Fix Status) ---
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = session.user.user_metadata.display_name || "Member";
        const isAdmin = (session.user.email === 'darzrm@gmail.com');
        const joinDate = new Date(session.user.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });

        container.innerHTML = `
            <div style="width: 100%; text-align: center;">
                <i data-lucide="circle-user" style="width:60px; height:60px; color:var(--orange-yellow-crayola); margin: 0 auto;"></i>
                <h3 class="h3" style="margin: 10px 0;">${user}</h3>
                
                <div class="account-detail-list" style="background: var(--onyx); padding: 15px; border-radius: 12px; margin: 20px 0; text-align: left;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:var(--light-gray-70);">Email</span>
                        <span style="color:var(--white-2);">${session.user.email}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:var(--light-gray-70);">Rank</span>
                        <span style="color:var(--orange-yellow-crayola); font-weight:600;">${isAdmin ? 'Admin' : 'Member'}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--light-gray-70);">Joined</span>
                        <span style="color:var(--white-2);">${joinDate}</span>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="form-btn" onclick="openEditProfile()">Edit Profile</button>
                    <button class="form-btn secondary" onclick="_supabase.auth.signOut().then(()=>location.reload())">Logout</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h3 class="h3">Join Community</h3>
                <p class="blog-text" style="margin: 15px 0;">Please login to interact with other eFootball designers and share your thoughts.</p>
                <button class="form-btn" style="margin:0 auto;" onclick="openAuth()">Login / Sign Up</button>
            </div>`;
    }
    lucide.createIcons();
};

window.openAuth = () => {
    const html = `
        <div class="form-group">
            <input type="email" id="f-email" class="form-input" placeholder="Email">
            <input type="password" id="f-pass" class="form-input" placeholder="Password">
            <input type="text" id="f-user" class="form-input" placeholder="Username (For new members)">
            <p onclick="forgotPassword()" style="color:var(--orange-yellow-crayola); font-size:11px; cursor:pointer; text-align:right;">Forgot Password?</p>
        </div>`;
    showModal("Account Access", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;

        const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            if (error.message.includes("Email not confirmed")) return showNotif("Please confirm email!", "mail");
            const { error: sErr } = await _supabase.auth.signUp({ email, password: pass, options: { data: { display_name: user } } });
            if (!sErr) { showNotif("Confirmation email sent!", "send"); closeGlobalModal(); }
            else showNotif(sErr.message, "alert-circle");
        } else { location.reload(); }
    });
};

// --- COMMENTS LOGIC (Fix Right Side) ---
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = (session?.user?.email === 'darzrm@gmail.com');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: true });

    list.innerHTML = data?.map(c => {
        const isMe = (session && session.user.id === c.user_id);
        const date = new Date(c.created_at).toLocaleString('en-GB', { hour:'2-digit', minute:'2-digit' });
        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <span class="comment-username">${c.username}</span>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">${date} ${(isAdmin || isMe) ? `<span onclick="doDelete('${c.id}')" style="color:#ff4b4b; cursor:pointer; margin-left:10px;">Delete</span>` : ''}</time>
            </div>`;
    }).join('') || '<p class="blog-text" style="text-align:center;">No comments yet.</p>';
};

// --- BLOG CONTENT WITH IMAGE ---
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    
    // Blog News Content
    const detail = document.getElementById('blog-content-detail');
    detail.innerHTML = `
        <figure class="blog-banner-box">
            <img src="./assets/images/eec.png" alt="Blog Banner">
        </figure>
        <h3 class="h3">Welcome to eFootball Edit Community</h3>
        <p class="blog-text">Hello editors! This is our new community space. Feel free to discuss and share your designs here.</p>
    `;
    loadComments(id);
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn) sidebarBtn.addEventListener("click", () => document.querySelector("[data-sidebar]").classList.toggle("active"));

    // Nav Logic
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            if(target === 'account') updateUI();
        }
    });

    // Form Submit
    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        if (!session) return showNotif("Login first!", "lock");

        await _supabase.from('comments').insert([{
            content: input.value, user_id: session.user.id,
            username: session.user.user_metadata.display_name || "Member",
            email: session.user.email, blog_id: 'hello-eec'
        }]);
        input.value = ''; loadComments('hello-eec');
    };
});

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

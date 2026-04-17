'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// --- NOTIFICATION ---
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

// --- ACCOUNT UI ---
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
                <h3 class="h3" style="margin: 15px 0;">${user}</h3>
                <div style="background: var(--onyx); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: left; border: 1px solid var(--jet);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="color:var(--light-gray-70);">Email</span>
                        <span style="color:var(--white-2);">${session.user.email}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <span style="color:var(--light-gray-70);">Status</span>
                        <span style="color:var(--orange-yellow-crayola); font-weight:600;">${isAdmin ? 'Admin' : 'Member'}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--light-gray-70);">Joined</span>
                        <span style="color:var(--white-2);">${joinDate}</span>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="form-btn" onclick="openEditProfile()">Edit Profile</button>
                    <button class="form-btn secondary" onclick="handleLogout()">Logout</button>
                </div>
            </div>`;
    } else {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h3 class="h3">Welcome!</h3>
                <p class="blog-text" style="margin: 15px 0;">Sign in to join the conversation and share your designs.</p>
                <button class="form-btn" style="margin:0 auto;" onclick="openAuth()">Sign In / Sign Up</button>
            </div>`;
    }
    lucide.createIcons();
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    location.reload();
};

window.openEditProfile = () => {
    showModal("Edit Username", `<div class="form-group"><input type="text" id="f-new-name" class="form-input" placeholder="New Username"></div>`, async () => {
        const newName = document.getElementById('f-new-name').value;
        if (newName) {
            const { error } = await _supabase.auth.updateUser({ data: { display_name: newName } });
            if (!error) { 
                showNotif("Username updated!", "check"); 
                setTimeout(() => location.reload(), 1000); 
            } else showNotif(error.message, "alert-circle");
        }
    });
};

window.openAuth = () => {
    const html = `
        <div class="form-group">
            <input type="email" id="f-email" class="form-input" placeholder="Email">
            <input type="password" id="f-pass" class="form-input" placeholder="Password">
            <input type="text" id="f-user" class="form-input" placeholder="Username (For Sign Up)">
        </div>`;
    showModal("Access Account", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;

        const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            const { error: sErr } = await _supabase.auth.signUp({ email, password: pass, options: { data: { display_name: user } } });
            if (!sErr) { showNotif("Check your email for confirmation!", "send"); closeGlobalModal(); }
            else showNotif(sErr.message, "alert-circle");
        } else { location.reload(); }
    });
};

// --- COMMENTS SYSTEM ---
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const form = document.getElementById('comment-form');
    const { data: { session } } = await _supabase.auth.getSession();
    
    if(form) form.style.display = session ? 'flex' : 'none';

    const isAdmin = (session?.user?.email === 'darzrm@gmail.com');
    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: true });

    list.innerHTML = data?.map(c => {
        const isMe = (session && session.user.id === c.user_id);
        const date = new Date(c.created_at).toLocaleString('en-GB', { 
            day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' 
        });
        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <span class="comment-username">${c.username}</span>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">
                    ${date} 
                    ${(isAdmin || isMe) ? `<span onclick="doDelete('${c.id}')" style="color:#ff4b4b; cursor:pointer; margin-left:10px; font-weight:600;">Delete</span>` : ''}
                </time>
            </div>`;
    }).join('') || '<p class="blog-text" style="text-align:center;">No comments yet.</p>';
    lucide.createIcons();
};

window.doDelete = async (id) => {
    if (confirm("Are you sure you want to delete this comment?")) {
        await _supabase.from('comments').delete().eq('id', id);
        loadComments('hello-eec');
        showNotif("Comment deleted", "trash");
    }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    
    // Sidebar Toggle
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    const sidebar = document.querySelector("[data-sidebar]");
    if (sidebarBtn) {
        sidebarBtn.onclick = () => sidebar.classList.toggle("active");
    }

    // Page Navigation
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
            if(target === 'account') updateUI();
        }
    });

    // Form Posting
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.getElementById('comment-input');
            if (!session) return;

            await _supabase.from('comments').insert([{
                content: input.value, 
                user_id: session.user.id,
                username: session.user.user_metadata.display_name || "Member",
                blog_id: 'hello-eec'
            }]);
            input.value = ''; 
            loadComments('hello-eec');
        };
    }
});

window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    document.getElementById('blog-content-detail').innerHTML = `
        <h3 class="h3">Hello Editors!</h3>
        <p class="blog-text">Welcome to the eFootball Edit Community. This is a space to share your designs, kits, and creative works. Be respectful and have fun!</p>
    `;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

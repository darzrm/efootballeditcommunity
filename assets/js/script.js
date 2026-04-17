'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * System Notification
 */
window.showNotif = (msg, icon = 'info') => {
    const existingNotif = document.querySelector('.eec-notif');
    if (existingNotif) existingNotif.remove();

    const notif = document.createElement('div');
    notif.className = 'eec-notif';
    notif.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
    document.body.appendChild(notif);
    
    lucide.createIcons();
    
    setTimeout(() => { 
        notif.style.opacity = '0'; 
        setTimeout(() => notif.remove(), 500); 
    }, 3000);
};

/**
 * Global Modal
 */
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
    lucide.createIcons();
};

window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

/**
 * Account Management
 */
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
                <div class="account-detail-list" style="text-align: left;">
                    <div class="detail-item">
                        <span class="detail-label">Email</span>
                        <span class="detail-value">${session.user.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value" style="color:var(--orange-yellow-crayola); font-weight:600;">${isAdmin ? 'Admin' : 'Member'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Joined</span>
                        <span class="detail-value">${joinDate}</span>
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
                <h3 class="h3">Join Community</h3>
                <p class="blog-text" style="margin: 15px 0;">Login to interact and share your designs.</p>
                <button class="form-btn" style="margin:0 auto;" onclick="openAuth()">Login / Sign Up</button>
            </div>`;
    }
    lucide.createIcons();
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    showNotif("Logged out successfully", "log-out");
    setTimeout(() => location.reload(), 1000);
};

window.openEditProfile = () => {
    showModal("Edit Profile", `
        <div class="form-group">
            <input type="text" id="f-new-name" class="form-input" placeholder="New Username">
        </div>`, async () => {
        const newName = document.getElementById('f-new-name').value;
        if (newName) {
            const { error } = await _supabase.auth.updateUser({ data: { display_name: newName } });
            if (!error) { 
                showNotif("Profile Updated!", "check"); 
                closeGlobalModal();
                updateUI();
            } else {
                showNotif(error.message, "alert-circle");
            }
        }
    });
};

window.openAuth = () => {
    const html = `
        <div class="form-group">
            <input type="email" id="f-email" class="form-input" placeholder="Email">
            <input type="password" id="f-pass" class="form-input" placeholder="Password">
            <input type="text" id="f-user" class="form-input" placeholder="Username (Sign Up Only)">
        </div>`;
    showModal("Account Access", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;

        const { error: signInError } = await _supabase.auth.signInWithPassword({ email, password: pass });
        if (signInError) {
            const { error: signUpError } = await _supabase.auth.signUp({ 
                email, 
                password: pass, 
                options: { data: { display_name: user || "Member" } } 
            });
            if (!signUpError) { 
                showNotif("Check email for confirmation!", "mail"); 
                closeGlobalModal();
            } else {
                showNotif(signUpError.message, "alert-circle");
            }
        } else { 
            location.reload(); 
        }
    });
};

/**
 * Comments System
 */
const loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    const form = document.getElementById('comment-form');
    if (!display) return;

    const { data: { session } } = await _supabase.auth.getSession();
    if (form) form.style.display = session ? 'flex' : 'none';

    const { data: comments, error } = await _supabase.from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    if (error) return;

    display.innerHTML = comments.map(c => {
        const isMe = session && session.user.id === c.user_id;
        const isAdmin = c.email === 'darzrm@gmail.com';
        
        // Format: 17 Apr 2026, 15:30
        const date = new Date(c.created_at).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <div class="comment-username">
                    <span style="font-weight:600;">${c.username}</span>
                    <span class="user-status ${isAdmin ? 'status-admin' : 'status-member'}">
                        ${isAdmin ? 'Admin' : 'Member'}
                    </span>
                </div>
                <span class="comment-email">${c.email || ''}</span>
                <p class="comment-text">${c.content}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                    <span class="comment-date">${date}</span>
                    ${(isMe || (session && session.user.email === 'darzrm@gmail.com')) ? 
                        `<i data-lucide="trash-2" onclick="deleteComment('${c.id}')" style="width:14px; color:#ff4b4b; cursor:pointer;"></i>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
};

window.deleteComment = async (id) => {
    if (confirm("Delete this comment?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) {
            showNotif("Comment deleted", "trash");
            loadComments('hello-eec');
        }
    }
};

/**
 * Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    lucide.createIcons();

    // Sidebar Toggle
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    const sidebar = document.querySelector("[data-sidebar]");
    if (sidebarBtn) {
        sidebarBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
    }

    // Navigation
    document.querySelectorAll("[data-nav-link]").forEach(link => {
        link.addEventListener("click", function() {
            const page = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === page));
            document.querySelectorAll("[data-nav-link]").forEach(l => l.classList.toggle('active', l === this));
            if (page === 'account') updateUI();
        });
    });

    // Form Submit
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.onsubmit = async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.getElementById('comment-input');
            if (!session) return;

            const { error } = await _supabase.from('comments').insert([{
                content: input.value,
                user_id: session.user.id,
                username: session.user.user_metadata.display_name || "Member",
                email: session.user.email,
                blog_id: 'hello-eec'
            }]);

            if (!error) {
                input.value = '';
                loadComments('hello-eec');
            } else {
                showNotif("Failed to post", "x-circle");
            }
        };
    }
});

window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    document.getElementById('blog-content-detail').innerHTML = `
        <h3 class="h3">Hello from EEC</h3>
        <p class="blog-text">Wadah bagi para desainer eFootball untuk berbagi karya.</p>`;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

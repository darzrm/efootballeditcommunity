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
window.showModal = (title, htmlContent, onConfirm) => {
    const modal = document.getElementById('global-modal');
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = htmlContent;
    
    const confirmBtn = document.getElementById('modal-confirm-btn');
    confirmBtn.onclick = async () => {
        await onConfirm();
        closeGlobalModal();
    };
    
    modal.classList.add('active');
};

window.closeGlobalModal = () => {
    document.getElementById('global-modal').classList.remove('active');
};

/**
 * Account UI Logic
 */
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = localStorage.getItem('eec_username') || "Member";
        const isAdmin = (user === 'dariraa');
        
        container.innerHTML = `
            <div class="profile-icon"><i data-lucide="circle-user" style="width:80px; height:80px;"></i></div>
            <h3 class="h3" style="display:flex; align-items:center; gap:8px; justify-content:center;">
                ${user} ${isAdmin ? '<i data-lucide="crown" style="color:#ffdb70; width:22px;"></i>' : ''}
            </h3>
            <p class="blog-text" style="opacity:0.6; margin-bottom: 20px;">${session.user.email}</p>
            <div style="display:grid; gap:12px; width:100%; max-width:260px; margin:0 auto;">
                <button class="form-btn" onclick="openEditProfile()">Update Profile</button>
                <button class="form-btn secondary" onclick="handleLogout()">Logout</button>
            </div>
        `;
        document.getElementById('comment-form').style.display = 'block';
    } else {
        container.innerHTML = `
            <div class="profile-icon"><i data-lucide="shield-lock" style="width:70px; height:70px; opacity:0.2;"></i></div>
            <h3 class="h3">Access Denied</h3>
            <p class="blog-text">Please sign in to join the community.</p>
            <button class="form-btn" style="margin-top:20px; width:100%; max-width:200px;" onclick="openAuth()">Login / Sign Up</button>
        `;
        document.getElementById('comment-form').style.display = 'none';
    }
    lucide.createIcons();
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    location.reload();
};

window.openAuth = () => {
    const html = `
        <div style="display:grid; gap:10px;">
            <input type="email" id="f-email" class="form-input" placeholder="Email Address">
            <input type="password" id="f-pass" class="form-input" placeholder="Password">
            <input type="text" id="f-user" class="form-input" placeholder="Username (Sign Up only)">
            <p style="font-size:11px; color:var(--light-gray-70);">*Username is required for new accounts.</p>
        </div>
    `;
    showModal("Account Access", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;

        const { error: lErr } = await _supabase.auth.signInWithPassword({ email, password: pass });
        if (lErr) {
            const { error: sErr } = await _supabase.auth.signUp({ email, password: pass });
            if (!sErr) {
                if(user) localStorage.setItem('eec_username', user);
                alert("Account created! You can now login.");
                location.reload();
            } else { alert(sErr.message); }
        } else { location.reload(); }
    });
};

window.openEditProfile = () => {
    showModal("Update Username", `<input type="text" id="f-new" class="form-input" placeholder="Enter new username">`, async () => {
        const val = document.getElementById('f-new').value;
        if (val) {
            const { data: { session } } = await _supabase.auth.getSession();
            localStorage.setItem('eec_username', val);
            if (session) {
                // Update username di komentar-komentar lama agar sinkron
                await _supabase.from('comments').update({ username: val }).eq('user_id', session.user.id);
            }
            location.reload();
        }
    });
};

/**
 * Comments Logic
 */
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = (localStorage.getItem('eec_username') === 'dariraa');

    const { data, error } = await _supabase.from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

    if (error) {
        list.innerHTML = `<p class="blog-text">Failed to load comments.</p>`;
        return;
    }

    list.innerHTML = data.map(c => {
        const isOwner = (session && session.user.id === c.user_id);
        const date = new Date(c.created_at).toLocaleString('en-GB', { 
            day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' 
        });
        
        return `
            <div class="comment-card" style="border-bottom: 1px solid var(--jet); padding: 15px 0; background:none;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; flex-direction:column;">
                        <span style="color:var(--orange-yellow-crayola); font-weight:600; font-size:14px; display:flex; align-items:center; gap:5px;">
                            ${c.username} ${c.username === 'dariraa' ? '<i data-lucide="crown" style="width:14px; color:#ffdb70;"></i>' : ''}
                        </span>
                        <span style="font-size:10px; color:var(--light-gray-70);">${c.email || ''}</span>
                    </div>
                    ${(isAdmin || isOwner) ? `
                        <button onclick="doDelete('${c.id}')" style="background:none; border:none; color:#ff4b4b; cursor:pointer; padding:5px;">
                            <i data-lucide="trash-2" style="width:18px;"></i>
                        </button>` : ''}
                </div>
                <p style="color:var(--light-gray); font-size:14px; margin-top:8px; line-height:1.6;">${c.content}</p>
                <time style="font-size:9px; color:var(--light-gray-70); margin-top:5px; display:block;">${date}</time>
            </div>
        `;
    }).join('') || '<p class="blog-text">No comments yet. Be the first to speak!</p>';
    
    lucide.createIcons();
};

window.doDelete = async (id) => {
    if (confirm("Permanently delete this comment?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) {
            loadComments('hello-eec');
        } else {
            alert("Delete failed: " + error.message);
        }
    }
};

/**
 * Event Listeners & Navigation
 */
document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    lucide.createIcons();

    // Tab Navigation Logic
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
            if(target === 'account') updateUI();
        }
    });

    // Sidebar Toggle for Mobile
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn) {
        sidebarBtn.onclick = () => document.querySelector("[data-sidebar]").classList.toggle("active");
    }

    // Comment Submission
    const cForm = document.getElementById('comment-form');
    if (cForm) {
        cForm.onsubmit = async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.getElementById('comment-input');
            
            if (!session) return alert("Please login to comment.");

            const { error } = await _supabase.from('comments').insert([{
                content: input.value,
                user_id: session.user.id,
                username: localStorage.getItem('eec_username') || "Member",
                email: session.user.email,
                blog_id: 'hello-eec'
            }]);

            if (!error) {
                input.value = '';
                loadComments('hello-eec');
            } else {
                alert(error.message);
            }
        };
    }
});

/**
 * News Detail Navigation
 */
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    
    const detail = document.getElementById('blog-content-detail');
    // Content can be made dynamic based on 'id' if you have more posts
    detail.innerHTML = `
        <h3 class="h3">Hello from EEC</h3>
        <p class="blog-text">
            Selamat datang di eFootball Edit Community. Ini adalah wadah bagi para desainer 
            untuk berbagi karya, teknik editing, dan mendiskusikan perkembangan eFootball 
            dari sisi visual.
        </p>
    `;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

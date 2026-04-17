'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// --- MODAL SYSTEM ---
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
};
window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

// --- ACCOUNT UI (Tampilan Baru) ---
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = localStorage.getItem('eec_username') || session.user.user_metadata.display_name || "Member";
        const isAdmin = (session.user.email === 'darzrm@gmail.com');
        const joinDate = new Date(session.user.created_at).toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' });

        container.innerHTML = `
            <div class="account-info-box">
                <div class="profile-icon" style="margin-bottom:15px;">
                    <i data-lucide="circle-user" style="width:70px; height:70px; margin:0 auto; color:var(--orange-yellow-crayola);"></i>
                </div>
                <h3 class="h3">${user} ${isAdmin ? '<i data-lucide="crown" style="width:18px; color:#ffdb70; display:inline-block; vertical-align:middle;"></i>' : ''}</h3>
                
                <div class="account-detail-list">
                    <div class="detail-item">
                        <span class="detail-label">Email</span>
                        <span class="detail-value">${session.user.email}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Joined Since</span>
                        <span class="detail-value">${joinDate}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">${isAdmin ? 'Admin' : 'Member'}</span>
                    </div>
                </div>

                <div style="display:grid; gap:10px;">
                    <button class="form-btn" onclick="openEditProfile()">Change Username</button>
                    <button class="form-btn secondary" onclick="_supabase.auth.signOut().then(()=>location.reload())">Logout</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="account-info-box">
                <i data-lucide="shield-lock" style="width:50px; opacity:0.2; margin:0 auto 15px;"></i>
                <p class="blog-text">Login to access your profile.</p>
                <button class="form-btn" style="margin-top:15px;" onclick="openAuth()">Login / Sign Up</button>
            </div>`;
    }
    lucide.createIcons();
};

window.openEditProfile = () => {
    showModal("Update Username", `<div class="form-group"><input type="text" id="f-new-name" class="form-input" placeholder="Enter new username"></div>`, async () => {
        const newName = document.getElementById('f-new-name').value;
        if (newName) {
            localStorage.setItem('eec_username', newName);
            const { data: { session } } = await _supabase.auth.getSession();
            // Update metadata di Supabase agar permanen
            await _supabase.auth.updateUser({ data: { display_name: newName } });
            // Update nama di komen-komen lama (opsional)
            await _supabase.from('comments').update({ username: newName }).eq('user_id', session.user.id);
            location.reload();
        }
    });
};

// --- AUTH LOGIC ---
window.openAuth = () => {
    const html = `
        <div class="form-group">
            <input type="email" id="f-email" class="form-input" placeholder="Email Address">
            <input type="password" id="f-pass" class="form-input" placeholder="Password">
            <input type="text" id="f-user" class="form-input" placeholder="Username (Sign Up only)">
            <p onclick="forgotPassword()" style="color:var(--orange-yellow-crayola); font-size:11px; cursor:pointer; text-align:right; margin-top:5px;">Forgot Password?</p>
        </div>`;
    
    showModal("Account Access", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;

        const { data: lData, error: lErr } = await _supabase.auth.signInWithPassword({ email, password: pass });

        if (lErr) {
            if (lErr.message.includes("Email not confirmed")) return alert("Please check your email and confirm!");
            
            const { error: sErr } = await _supabase.auth.signUp({
                email, password: pass, options: { data: { display_name: user } }
            });

            if (!sErr) alert("Verification email sent!"); else alert(sErr.message);
        } else {
            localStorage.setItem('eec_username', lData.user.user_metadata.display_name || "Member");
            location.reload();
        }
    });
};

window.forgotPassword = () => {
    const html = `<div class="form-group"><input type="email" id="reset-email" class="form-input" placeholder="Email Address"></div>`;
    showModal("Reset Password", html, async () => {
        const email = document.getElementById('reset-email').value;
        await _supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        alert("Link sent!"); closeGlobalModal();
    });
};

// --- COMMENTS LOGIC ---
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = (session?.user?.email === 'darzrm@gmail.com');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: true });

    list.innerHTML = data?.map(c => {
        const isMe = (session && session.user.id === c.user_id);
        const fullDate = new Date(c.created_at).toLocaleString('en-GB', { 
            day:'2-digit', month:'short', hour: '2-digit', minute: '2-digit' 
        });
        
        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <div class="comment-user-box">
                    <span class="comment-username">${c.username}</span>
                    ${(isAdmin || isMe) ? `<button onclick="doDelete('${c.id}')" style="background:none; border:none; color:#ff4b4b; cursor:pointer;"><i data-lucide="trash-2" style="width:12px;"></i></button>` : ''}
                </div>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">${fullDate}</time>
            </div>`;
    }).join('') || '<p class="blog-text" style="text-align:center;">No messages yet.</p>';
    lucide.createIcons();
};

window.doDelete = async (id) => {
    if (confirm("Delete this message?")) {
        await _supabase.from('comments').delete().eq('id', id);
        loadComments('hello-eec');
    }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    updateUI();

    _supabase.auth.onAuthStateChange(async (event) => {
        if (event === "PASSWORD_RECOVERY") {
            const newPass = prompt("Enter new password:");
            if (newPass) await _supabase.auth.updateUser({ password: newPass }).then(() => alert("Password Updated!"));
        }
    });

    // Navigation & Comment Form Submit tetap sama seperti sebelumnya...
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            if(target === 'account') updateUI();
        }
    });

    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        if (!session) return;

        await _supabase.from('comments').insert([{
            content: input.value, user_id: session.user.id,
            username: localStorage.getItem('eec_username') || session.user.user_metadata.display_name || "Member",
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

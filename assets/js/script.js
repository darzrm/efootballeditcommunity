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

// --- AUTH LOGIC (LOGIN, SIGNUP, RESET) ---
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

        // 1. Coba Login
        const { data: lData, error: lErr } = await _supabase.auth.signInWithPassword({ email, password: pass });

        if (lErr) {
            // Jika belum verifikasi email
            if (lErr.message.includes("Email not confirmed")) {
                return alert("Please confirm your email address first. Check your inbox!");
            }
            
            // 2. Jika login gagal karena akun tidak ada, maka Sign Up
            const { error: sErr } = await _supabase.auth.signUp({
                email, password: pass,
                options: { data: { display_name: user } }
            });

            if (!sErr) {
                alert("Verification email sent! Check your inbox before logging in.");
                closeGlobalModal();
            } else { alert(sErr.message); }
        } else {
            // Login berhasil, simpan username ke local storage
            const finalName = lData.user.user_metadata.display_name || user || "Member";
            localStorage.setItem('eec_username', finalName);
            location.reload();
        }
    });
};

window.forgotPassword = () => {
    const html = `
        <div class="form-group">
            <p class="blog-text" style="font-size:12px; margin-bottom:10px;">Enter your email to receive a reset link:</p>
            <input type="email" id="reset-email" class="form-input" placeholder="Email Address">
        </div>`;
    showModal("Reset Password", html, async () => {
        const email = document.getElementById('reset-email').value;
        const { error } = await _supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (!error) alert("Reset link sent! Check your email.");
        else alert(error.message);
    });
};

// --- UI & COMMENTS ---
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = localStorage.getItem('eec_username') || session.user.user_metadata.display_name || "Member";
        const isAdmin = (session.user.email === 'darzrm@gmail.com');
        container.innerHTML = `
            <div class="profile-icon"><i data-lucide="circle-user" style="width:80px; height:80px; color:var(--orange-yellow-crayola);"></i></div>
            <h3 class="h3">${user} ${isAdmin ? '<i data-lucide="crown" style="color:#ffdb70; width:20px;"></i>' : ''}</h3>
            <p class="blog-text" style="opacity:0.6; margin-bottom:20px;">${session.user.email}</p>
            <button class="form-btn secondary" onclick="_supabase.auth.signOut().then(()=>location.reload())">Logout</button>
        `;
        document.getElementById('comment-form').style.display = 'block';
    } else {
        container.innerHTML = `<button class="form-btn" onclick="openAuth()">Login / Sign Up</button>`;
        document.getElementById('comment-form').style.display = 'none';
    }
    lucide.createIcons();
};

const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const { data: { session } } = await _supabase.auth.getSession();
    const isAdmin = (session?.user?.email === 'darzrm@gmail.com');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: true });

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
                    ${(isAdmin || isMe) ? `<button class="delete-btn" onclick="doDelete('${c.id}')"><i data-lucide="trash-2" style="width:14px;"></i></button>` : ''}
                </div>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">${date}</time>
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

    // Deteksi jika user datang dari link Reset Password
    _supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
            const newPass = prompt("Enter your new password:");
            if (newPass) {
                const { error } = await _supabase.auth.updateUser({ password: newPass });
                if (!error) {
                    alert("Password updated! Please login with your new password.");
                    await _supabase.auth.signOut();
                    location.reload();
                } else alert(error.message);
            }
        }
    });

    // Navigasi & Sidebar
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if(sidebarBtn) sidebarBtn.onclick = () => document.querySelector("[data-sidebar]").classList.toggle("active");

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

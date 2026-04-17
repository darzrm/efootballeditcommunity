'use strict';

/**
 * Konfigurasi Supabase
 */
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * Sistem Notifikasi Kustom (Modern)
 */
window.showNotif = (msg, icon = 'info') => {
    const existingNotif = document.querySelector('.eec-notif');
    if (existingNotif) existingNotif.remove();

    const notif = document.createElement('div');
    notif.className = 'eec-notif';
    notif.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: var(--bg-gradient-yellow-1); color: var(--smoky-black);
        border-radius: 12px; font-weight: 600; box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        z-index: 9999; display: flex; align-items: center; gap: 10px;
        animation: slideIn 0.5s ease forwards;
    `;
    notif.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
    document.body.appendChild(notif);
    lucide.createIcons();

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(20px)';
        notif.style.transition = '0.5s';
        setTimeout(() => notif.remove(), 500);
    }, 4000);
};

/**
 * Modal System
 */
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
};
window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

/**
 * Account & UI Logic
 */
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (session) {
        const user = session.user.user_metadata.display_name || localStorage.getItem('eec_username') || "Member";
        const isAdmin = (session.user.email === 'darzrm@gmail.com');
        const joinDate = new Date(session.user.created_at).toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' });

        container.innerHTML = `
            <div class="account-info-box" style="width: 100%;">
                <header style="text-align:center; margin-bottom: 20px;">
                    <i data-lucide="circle-user" style="width:60px; height:60px; color:var(--orange-yellow-crayola); margin: 0 auto;"></i>
                    <h3 class="h3" style="margin-top:10px;">${user}</h3>
                    <p class="blog-text" style="font-size:12px;">Welcome back to the community!</p>
                </header>
                
                <div class="account-detail-list">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="color:var(--light-gray-70);">Email</span>
                        <span style="color:var(--white-2);">${session.user.email}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--light-gray-70);">Member Sejak</span>
                        <span style="color:var(--white-2);">${joinDate}</span>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                    <button class="form-btn" onclick="openEditProfile()">Edit Profile</button>
                    <button class="form-btn secondary" onclick="handleLogout()">Logout</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <i data-lucide="user-plus" style="width:50px; margin:0 auto 15px; opacity:0.3;"></i>
                <h3 class="h3">Gabung Komunitas</h3>
                <p class="blog-text" style="margin-bottom:20px; line-height: 1.6;">
                    Silahkan login untuk berinteraksi dengan komunitas, memberikan komentar, 
                    dan mendapatkan update terbaru dari desainer eFootball lainnya.
                </p>
                <button class="form-btn" style="margin:0 auto;" onclick="openAuth()">Login / Sign Up Sekarang</button>
            </div>`;
    }
    lucide.createIcons();
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    localStorage.removeItem('eec_username');
    location.reload();
};

window.openEditProfile = () => {
    showModal("Ganti Username", `<div class="form-group"><input type="text" id="f-new-name" class="form-input" placeholder="Username baru..."></div>`, async () => {
        const newName = document.getElementById('f-new-name').value;
        if (newName) {
            const { error } = await _supabase.auth.updateUser({ data: { display_name: newName } });
            if (!error) {
                localStorage.setItem('eec_username', newName);
                showNotif("Username berhasil diperbarui!", "check");
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
            <input type="text" id="f-user" class="form-input" placeholder="Username (Hanya untuk daftar baru)">
            <p onclick="forgotPassword()" style="color:var(--orange-yellow-crayola); font-size:11px; cursor:pointer; text-align:right; margin-top:5px;">Lupa Password?</p>
        </div>`;
    
    showModal("Akses Akun", html, async () => {
        const email = document.getElementById('f-email').value;
        const pass = document.getElementById('f-pass').value;
        const user = document.getElementById('f-user').value;

        const { data, error } = await _supabase.auth.signInWithPassword({ email, password: pass });

        if (error) {
            if (error.message.includes("Email not confirmed")) {
                showNotif("Email belum dikonfirmasi. Cek inbox!", "mail-warning");
                return;
            }
            // Jika akun tidak ditemukan, lakukan Sign Up
            const { error: sErr } = await _supabase.auth.signUp({
                email, password: pass, options: { data: { display_name: user } }
            });

            if (!sErr) {
                showNotif("Email konfirmasi terkirim! Silahkan cek inbox.", "send");
                closeGlobalModal();
            } else showNotif(sErr.message, "alert-circle");
        } else {
            localStorage.setItem('eec_username', data.user.user_metadata.display_name || "Member");
            showNotif("Login Berhasil!", "check-circle");
            setTimeout(() => location.reload(), 1000);
        }
    });
};

window.forgotPassword = () => {
    const html = `<div class="form-group"><input type="email" id="reset-email" class="form-input" placeholder="Masukkan Email Anda"></div>`;
    showModal("Reset Password", html, async () => {
        const email = document.getElementById('reset-email').value;
        const { error } = await _supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
        if (!error) showNotif("Link reset terkirim ke email!", "send");
        else showNotif(error.message, "alert-circle");
    });
};

/**
 * Comments Logic
 */
const loadComments = async (blogId) => {
    const list = document.getElementById('comment-display');
    const form = document.getElementById('comment-form');
    const { data: { session } } = await _supabase.auth.getSession();
    
    // Pastikan tombol post muncul jika login
    if(form) form.style.display = session ? 'flex' : 'none';

    const isAdmin = (session?.user?.email === 'darzrm@gmail.com');
    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: true });

    list.innerHTML = data?.map(c => {
        const isMe = (session && session.user.id === c.user_id);
        const date = new Date(c.created_at).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        
        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <div class="comment-user-box" style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="comment-username">${c.username}</span>
                    ${(isAdmin || isMe) ? `<button onclick="doDelete('${c.id}')" style="background:none; border:none; color:#ff4b4b; cursor:pointer;"><i data-lucide="trash-2" style="width:14px;"></i></button>` : ''}
                </div>
                <p class="comment-text">${c.content}</p>
                <time class="comment-date">${date}</time>
            </div>`;
    }).join('') || '<p class="blog-text" style="text-align:center;">Belum ada komentar.</p>';
    
    lucide.createIcons();
};

window.doDelete = async (id) => {
    if (confirm("Hapus komentar ini?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) {
            showNotif("Komentar dihapus", "trash");
            loadComments('hello-eec');
        }
    }
};

/**
 * Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
    // 1. Perbaikan Sidebar Toggle
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    const sidebar = document.querySelector("[data-sidebar]");
    if (sidebarBtn && sidebar) {
        sidebarBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
    }

    // 2. Deteksi Reset Password
    _supabase.auth.onAuthStateChange(async (event) => {
        if (event === "PASSWORD_RECOVERY") {
            const newPass = prompt("Masukkan password baru anda:");
            if (newPass) {
                await _supabase.auth.updateUser({ password: newPass });
                showNotif("Password berhasil diganti!", "check");
            }
        }
    });

    // 3. Inisialisasi UI
    updateUI();

    // 4. Navigasi Page
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
            if(target === 'account') updateUI();
        }
    });

    // 5. Submit Komentar
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
                username: localStorage.getItem('eec_username') || session.user.user_metadata.display_name || "Member",
                email: session.user.email, 
                blog_id: 'hello-eec'
            }]);

            if(!error) {
                input.value = '';
                loadComments('hello-eec');
            } else showNotif("Gagal mengirim komentar", "x-circle");
        };
    }
});

/**
 * Blog Navigation
 */
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

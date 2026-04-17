'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

let idToDelete = null;

const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const accContent = document.getElementById('account-content');
    if (!accContent) return;

    if (session) {
        const username = localStorage.getItem('eec_username') || session.user.email.split('@')[0];
        // Logo Admin di sebelah nama
        const adminIcon = (username === 'dariraa') ? '<ion-icon name="people-outline" class="admin-badge"></ion-icon>' : '';
        
        accContent.innerHTML = `
            <div class="profile-icon"><ion-icon name="person-circle"></ion-icon></div>
            <h3 class="h3" style="display:flex; align-items:center; gap:8px;">${username} ${adminIcon}</h3>
            <p class="blog-text" style="margin-bottom:25px; opacity:0.7;">${session.user.email}</p>
            <div style="display:grid; gap:10px; width:100%; max-width:250px;">
                <button class="form-btn" onclick="handleChangeUsername()">Ubah Username</button>
                <button class="form-btn secondary" onclick="handleSignOut()">Logout</button>
            </div>
        `;
    } else {
        accContent.innerHTML = `
            <div class="profile-icon"><ion-icon name="lock-closed-outline" style="opacity:0.3;"></ion-icon></div>
            <h3 class="h3">Belum Login</h3>
            <p class="blog-text" style="margin: 15px 0;">Silahkan login untuk mengatur profil kamu.</p>
            <button class="form-btn" onclick="openAuthModal()">Login / Daftar</button>
        `;
    }
};

window.handleChangeUsername = async () => {
    const current = localStorage.getItem('eec_username') || "User";
    const newName = prompt("Masukkan username baru:", current);
    
    if (newName && newName.trim() !== "") {
        const { data: { session } } = await _supabase.auth.getSession();
        const cleanName = newName.trim();
        
        // 1. Update di LocalStorage
        localStorage.setItem('eec_username', cleanName);
        
        // 2. Update otomatis semua komentar lama milik user ini di database
        if (session) {
            await _supabase.from('comments')
                .update({ username: cleanName })
                .eq('user_id', session.user.id);
        }
        
        alert("Username diperbarui!");
        location.reload();
    }
};

window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    
    const detail = document.getElementById('blog-content-detail');
    // Konten blog menggunakan format HTML
    detail.innerHTML = `
        <figure class="blog-banner-box" style="margin-bottom: 20px;">
            <img src="./assets/images/g1.jpg" style="width: 100%; border-radius: 16px;">
        </figure>
        <h3 class="h3 blog-item-title" style="margin-bottom: 10px;">Hello from EEC</h3>
        <p class="blog-text">
            Selamat datang di <b>eFootball Edit Community</b>. Ini adalah wadah bagi para desainer 
            untuk berbagi karya dan teknik editing eFootball.
        </p>
    `;
    loadComments(id);
};

const loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    const isAdmin = (localStorage.getItem('eec_username') === 'dariraa');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: false });

    display.innerHTML = data?.map(c => {
        const isUserAdmin = (c.username === 'dariraa');
        const badge = isUserAdmin ? '<ion-icon name="people-outline" class="admin-badge"></ion-icon>' : '';
        const deleteBtn = isAdmin ? `<button onclick="triggerDelete('${c.id}')" style="float:right; color:#ff4b4b; background:none; border:none; cursor:pointer; font-size:18px;"><ion-icon name="trash-outline"></ion-icon></button>` : '';

        return `
            <div class="comment-card">
                ${deleteBtn}
                <div class="comment-user">${c.username} ${badge}</div>
                <div class="comment-text">${c.content}</div>
                <div style="font-size:10px; opacity:0.4; margin-top:5px;">${new Date(c.created_at).toLocaleDateString()}</div>
            </div>
        `;
    }).join('') || '<p class="blog-text">Belum ada komentar.</p>';
};

window.triggerDelete = async (id) => {
    if (confirm("Hapus komentar ini?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) {
            loadComments('hello-eec');
        } else {
            alert("Gagal hapus: " + error.message);
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    updateUI();

    // Nav Logic
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
        }
    });

    // Kirim Komentar
    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        
        if (!session) return alert("Login dulu!");

        const user = localStorage.getItem('eec_username') || session.user.email.split('@')[0];

        const { error } = await _supabase.from('comments').insert([{
            content: input.value,
            user_id: session.user.id,
            username: user,
            blog_id: 'hello-eec'
        }]);

        if (!error) {
            input.value = '';
            loadComments('hello-eec');
        }
    };
});

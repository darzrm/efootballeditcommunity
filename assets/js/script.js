'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const accContent = document.getElementById('account-content');
    if (!accContent) return;

    if (session) {
        const username = localStorage.getItem('eec_username') || session.user.email.split('@')[0];
        // Gunakan Mahkota Lucide
        const adminIcon = (username === 'dariraa') ? '<i data-lucide="crown" class="admin-badge"></i>' : '';
        
        accContent.innerHTML = `
            <div class="profile-icon"><i data-lucide="user-circle-2" style="width:80px; height:80px;"></i></div>
            <h3 class="h3" style="display:flex; align-items:center; gap:8px; justify-content:center;">${username} ${adminIcon}</h3>
            <p class="blog-text" style="margin-bottom:25px; opacity:0.7;">${session.user.email}</p>
            <div style="display:grid; gap:10px; width:100%; max-width:250px; margin: 0 auto;">
                <button class="form-btn" onclick="handleChangeUsername()">Ubah Username</button>
                <button class="form-btn secondary" onclick="handleSignOut()">Logout</button>
            </div>
        `;
    } else {
        accContent.innerHTML = `
            <div class="profile-icon"><i data-lucide="shield-alert" style="opacity:0.3; width:80px; height:80px;"></i></div>
            <h3 class="h3">Belum Login</h3>
            <p class="blog-text" style="margin: 15px 0;">Silahkan login untuk mengatur profil kamu.</p>
            <button class="form-btn" onclick="openAuthModal()">Login / Daftar</button>
        `;
    }
    lucide.createIcons(); // Penting: Gambar ulang ikon
};

const loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    const isAdmin = (localStorage.getItem('eec_username') === 'dariraa');

    const { data } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: false });

    display.innerHTML = data?.map(c => {
        const isUserAdmin = (c.username === 'dariraa');
        const badge = isUserAdmin ? '<i data-lucide="crown" class="admin-badge"></i>' : '';
        const deleteBtn = isAdmin ? `<button onclick="triggerDelete('${c.id}')" style="float:right; color:#ff4b4b; background:none; border:none; cursor:pointer;"><i data-lucide="trash-2" style="width:18px;"></i></button>` : '';

        return `
            <div class="comment-card" style="border-bottom: 1px solid var(--jet); padding: 15px 0;">
                ${deleteBtn}
                <div class="comment-user" style="display:flex; align-items:center; gap:5px; color:var(--orange-yellow-crayola); font-weight:600;">
                    ${c.username} ${badge}
                </div>
                <div class="comment-text" style="color:var(--light-gray); margin-top:5px; font-size:14px;">${c.content}</div>
                <div style="font-size:10px; opacity:0.4; margin-top:5px;">${new Date(c.created_at).toLocaleDateString()}</div>
            </div>
        `;
    }).join('') || '<p class="blog-text">Belum ada komentar.</p>';
    
    lucide.createIcons(); // Penting: Gambar ulang ikon di komentar
};

window.handleChangeUsername = async () => {
    const current = localStorage.getItem('eec_username') || "User";
    const newName = prompt("Masukkan username baru:", current);
    
    if (newName && newName.trim() !== "") {
        const { data: { session } } = await _supabase.auth.getSession();
        const cleanName = newName.trim();
        localStorage.setItem('eec_username', cleanName);
        
        if (session) {
            await _supabase.from('comments').update({ username: cleanName }).eq('user_id', session.user.id);
        }
        location.reload();
    }
};

window.triggerDelete = async (id) => {
    if (confirm("Hapus komentar ini?")) {
        const { error } = await _supabase.from('comments').delete().eq('id', id);
        if (!error) loadComments('hello-eec');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    
    // Logic Navigasi
    document.querySelectorAll("[data-nav-link]").forEach(btn => {
        btn.onclick = function() {
            const target = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === target));
            document.querySelectorAll("[data-nav-link]").forEach(b => b.classList.toggle('active', b === this));
            window.scrollTo(0, 0);
            if(target === 'account') updateUI(); // Refresh UI saat buka tab account
        }
    });

    // Form Komentar
    document.getElementById('comment-form').onsubmit = async (e) => {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        if (!session) return alert("Login dulu!");

        const user = localStorage.getItem('eec_username') || session.user.email.split('@')[0];
        await _supabase.from('comments').insert([{
            content: input.value,
            user_id: session.user.id,
            username: user,
            blog_id: 'hello-eec'
        }]);
        input.value = '';
        loadComments('hello-eec');
    };
});

window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    const detail = document.getElementById('blog-content-detail');
    detail.innerHTML = `
        <h3 class="h3 blog-item-title">Hello from EEC</h3>
        <p class="blog-text">Wadah bagi para desainer eFootball untuk berbagi karya.</p>
    `;
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

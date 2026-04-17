'use strict';

// --- KONFIGURASI SUPABASE ---
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * 1. NOTIFIKASI SIMPEL DI ATAS
 */
window.showNotif = (msg) => {
    const old = document.querySelector('.eec-notif');
    if (old) old.remove();

    const notif = document.createElement('div');
    notif.className = 'eec-notif';
    notif.innerHTML = `<span>${msg}</span>`;
    document.body.appendChild(notif);
    
    setTimeout(() => { 
        notif.style.opacity = '0';
        setTimeout(() => notif.remove(), 500); 
    }, 2500);
};

/**
 * 2. NAVIGASI HALAMAN (FIX MY ACCOUNT)
 */
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");

    navLinks.forEach(link => {
        link.onclick = function() {
            const target = this.innerText.toLowerCase().trim();
            
            // Toggle Halaman Aktif
            pages.forEach(p => {
                if(p.dataset.page === target) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });

            // Toggle Class Active di Tombol Navigasi
            navLinks.forEach(l => l.classList.toggle('active', l === this));
            window.scrollTo(0, 0);

            // Jika ke halaman account, jalankan fungsi updateUI (jika ada)
            if(target === 'account') {
                if (typeof updateUI === 'function') updateUI();
            }
        };
    });

    // Inisialisasi ikon Lucide pertama kali
    if (window.lucide) lucide.createIcons();
});

/**
 * 3. LOGIKA BLOG & DESKRIPSI
 */
window.openBlog = (id) => {
    const listContainer = document.getElementById('blog-list-container');
    const detailContainer = document.getElementById('blog-detail-container');
    const contentDetail = document.getElementById('blog-content-detail');

    if (listContainer) listContainer.style.display = 'none';
    if (detailContainer) detailContainer.style.display = 'block';

    // Mengembalikan deskripsi blog yang hilang
    if (contentDetail) {
        contentDetail.innerHTML = `
            <h3 class="h3" style="margin-bottom: 10px;">Hello from EEC</h3>
            <p class="blog-text" style="color: var(--light-gray); line-height: 1.6;">
                Wadah bagi para desainer eFootball untuk berbagi karya, inspirasi, dan teknik editing terbaru. 
                Mari bangun komunitas yang positif!
            </p>
        `;
    }
    
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

/**
 * 4. LOAD KOMENTAR (MINIMALIS: LOGO + NAMA SEJAJAR)
 */
window.loadComments = async (blogId) => {
    const { data: comments } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    const { data: { session } } = await _supabase.auth.getSession();
    const display = document.getElementById('comment-display');
    if (!display) return;
    
    display.innerHTML = '';

    comments.forEach(comment => {
        const isMe = session?.user?.id === comment.user_id;
        const isAdmin = comment.email === "admin@eec.com"; 
        
        // Pilih Ikon polosan sesuai request
        const iconName = isAdmin ? 'user-round-check' : 'user-round';
        const iconClass = isAdmin ? 'status-admin' : 'status-member';

        // Format waktu detail
        const timeDetail = new Date(comment.created_at).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = `comment-card ${isMe ? 'is-me' : ''}`;
        
        card.innerHTML = `
            <div class="comment-header" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="${iconName}" class="${iconClass}" style="width: 16px; height: 16px;"></i>
                <span class="comment-username">${comment.username}</span>
            </div>
            <p class="comment-text">${comment.content}</p>
            <div class="comment-footer" style="display: flex; justify-content: flex-end; margin-top: 4px;">
                <span class="comment-date" style="font-size: 9px; opacity: 0.6;">${timeDetail}</span>
            </div>
        `;
        display.appendChild(card);
    });
    
    // Render ulang ikon lucide agar muncul di komentar
    if (window.lucide) lucide.createIcons();
};

/**
 * 5. FORM SUBMIT KOMENTAR
 */
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'comment-form') {
        e.preventDefault();
        const { data: { session } } = await _supabase.auth.getSession();
        const input = document.getElementById('comment-input');
        
        if (!session) {
            showNotif("Silakan login terlebih dahulu");
            return;
        }

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
            showNotif("Komentar terkirim!");
        } else {
            showNotif("Gagal mengirim komentar");
        }
    }
});

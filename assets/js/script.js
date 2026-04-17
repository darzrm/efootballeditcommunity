'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * NOTIFIKASI SIMPEL DI ATAS
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
    }, 2000);
};

/**
 * NAVIGASI HALAMAN (Termasuk Perbaikan My Account)
 */
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");

    navLinks.forEach(link => {
        link.onclick = function() {
            const target = this.innerText.toLowerCase().trim();
            
            pages.forEach(p => {
                if(p.dataset.page === target) {
                    p.classList.add('active');
                } else {
                    p.classList.remove('active');
                }
            });

            navLinks.forEach(l => l.classList.toggle('active', l === this));
            window.scrollTo(0, 0);

            if(target === 'account') {
                if (typeof updateUI === 'function') updateUI();
            }
        };
    });
    
    // Inisialisasi ikon Lucide
    lucide.createIcons();
});

/**
 * BLOG & DESKRIPSI (Perbaikan Deskripsi yang Hilang)
 */
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    const detail = document.getElementById('blog-detail-container');
    detail.style.display = 'block';
    
    // Mengisi kembali deskripsi blog
    document.getElementById('blog-content-detail').innerHTML = `
        <h3 class="h3" style="margin-bottom: 10px;">Hello from EEC</h3>
        <p class="blog-text" style="color: var(--light-gray); line-height: 1.6;">
            Wadah bagi para desainer eFootball untuk berbagi karya, inspirasi, dan teknik editing terbaru. 
            Mari bangun komunitas yang positif!
        </p>
    `;
    
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

/**
 * LOAD KOMENTAR DENGAN IKON MEMBER/ADMIN
 */
window.loadComments = async (blogId) => {
    const { data: comments } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    const display = document.getElementById('comment-display');
    display.innerHTML = '';

    comments.forEach(comment => {
        const isAdmin = comment.email === "admin@eec.com"; // Sesuaikan email admin
        
        // Pilih Ikon Berdasarkan Status
        const iconName = isAdmin ? 'user-round-check' : 'user-round';
        const statusLabel = isAdmin ? 'Admin' : 'Member';
        const statusClass = isAdmin ? 'status-admin' : 'status-member';

        const card = document.createElement('div');
        card.className = `comment-card`;
        card.innerHTML = `
            <div class="comment-header">
                <i data-lucide="${iconName}" class="user-icon ${statusClass}"></i>
                <span class="comment-username">${comment.username}</span>
                <span class="user-status ${statusClass}">${statusLabel}</span>
            </div>
            <p class="comment-text">${comment.content}</p>
        `;
        display.appendChild(card);
    });
    lucide.createIcons(); // Penting: Gambar ulang ikon setelah HTML dimasukkan
};

'use strict';

// 1. KONFIGURASI SUPABASE (Hanya inisialisasi sekali)
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// 2. SIDEBAR TOGGLE
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) {
    sidebarBtn.onclick = () => sidebar.classList.toggle("active");
}

// 3. FUNGSI UPDATE UI (Suntik ke #account-content)
async function updateUI() {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    const commentForm = document.getElementById('comment-form');
    
    if (!container) return;

    if (!session) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p style="color:var(--light-gray); margin-bottom:20px;">Masuk untuk posting komentar.</p>
                <button class="form-btn" onclick="showAuthModal('login')" style="margin: 0 auto;">Sign In</button>
            </div>`;
        if (commentForm) commentForm.style.display = 'none';
    } else {
        container.innerHTML = `
            <div style="text-align:center;">
                <h3 class="h3">${session.user.user_metadata.display_name || 'Member'}</h3>
                <p style="color:var(--light-gray-70); font-size:13px; margin: 10px 0 20px;">${session.user.email}</p>
                <button class="form-btn secondary" onclick="handleLogout()" style="margin: 0 auto;">Sign Out</button>
            </div>`;
        if (commentForm) commentForm.style.display = 'flex';
    }
}

// 4. NAVIGASI HALAMAN (Fix Sign In Klik & Page Active)
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");

    navLinks.forEach(link => {
        link.onclick = function() {
            const target = this.innerText.toLowerCase().trim();
            
            pages.forEach(p => {
                if (p.dataset.page === target) {
                    p.classList.add("active");
                    p.style.display = "block"; 
                } else {
                    p.classList.remove("active");
                    p.style.display = "none";
                }
            });

            navLinks.forEach(l => l.classList.toggle("active", l === this));
            window.scrollTo(0, 0);

            if (target === "account") updateUI();
        };
    });

    updateUI(); // Cek login saat pertama kali load
});

// 5. KOMENTAR (Admin: Check, Member: Polos)
window.loadComments = async (blogId) => {
    const { data: comments } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    const display = document.getElementById('comment-display');
    if (!display) return;
    display.innerHTML = '';

    if (comments) {
        comments.forEach(comment => {
            const isAdmin = comment.email === "admin@eec.com"; 
            const iconName = isAdmin ? 'user-round-check' : 'user-round'; // Admin dapet centang
            const iconColor = isAdmin ? 'var(--orange-yellow-crayola)' : 'var(--light-gray-70)';
            const time = new Date(comment.created_at).toLocaleString('id-ID', { 
                day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' 
            });

            const card = document.createElement('div');
            card.className = `comment-card`;
            card.innerHTML = `
                <div class="comment-header" style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <i data-lucide="${iconName}" style="width:14px; height:14px; color:${iconColor}; stroke-width:2.5px; margin-top:-2px;"></i>
                    <span class="comment-username" style="font-size:13px; font-weight:600; color:var(--white-2);">${comment.username}</span>
                </div>
                <p class="comment-text" style="font-size:14px; color:var(--light-gray); padding-left:22px;">${comment.content}</p>
                <div class="comment-footer" style="display:flex; justify-content:flex-end; align-items:center; gap:8px; margin-top:8px; border-top:1px solid rgba(255,255,255,0.05); padding-top:4px;">
                    <span style="font-size:9px; color:var(--light-gray-70); opacity:0.6;">${comment.email || ''}</span>
                    <span style="font-size:9px; color:var(--light-gray-70); opacity:0.6;">•</span>
                    <span style="font-size:9px; color:var(--light-gray-70); opacity:0.6;">${time}</span>
                </div>
            `;
            display.appendChild(card);
        });
    }
    if (window.lucide) lucide.createIcons();
};

// 6. FUNGSI BLOG & DESKRIPSI
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    
    // Suntikkan deskripsi yang kosong di HTML
    const detail = document.getElementById('blog-content-detail');
    if (detail) {
        detail.innerHTML = `
            <h3 class="h3">Hello from EEC</h3>
            <p class="blog-text" style="color:var(--light-gray); margin-top:10px;">
                Wadah bagi para desainer eFootball untuk berbagi karya dan teknik editing.
            </p>`;
    }
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    updateUI();
};

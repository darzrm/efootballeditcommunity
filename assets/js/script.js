'use strict';

// --- KONFIGURASI SUPABASE ---
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * 1. SIDEBAR TOGGLE (Show Contact)
 */
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

if (sidebarBtn) {
    sidebarBtn.addEventListener("click", function () { 
        sidebar.classList.toggle("active"); 
    });
}

/**
 * 2. NAVIGASI HALAMAN (Fix Sign In / Account)
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

            // Jika klik navigasi yang mengarah ke account
            if(target === 'account') updateUI();
        };
    });

    if (window.lucide) lucide.createIcons();
    updateUI(); 
});

/**
 * 3. UPDATE UI ACCOUNT
 */
async function updateUI() {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container) return;

    if (!session) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p style="color:var(--light-gray); margin-bottom:20px;">Silakan masuk ke akun Anda</p>
                <button class="form-btn" onclick="showAuthModal('login')">Sign In</button>
            </div>`;
    } else {
        const user = session.user;
        container.innerHTML = `
            <div class="account-info" style="text-align:center;">
                <h3 class="h3">${user.user_metadata.display_name || 'Member'}</h3>
                <p style="color:var(--light-gray-70); font-size:13px; margin-bottom:20px;">${user.email}</p>
                <button class="form-btn secondary" onclick="handleLogout()">Sign Out</button>
            </div>`;
    }
}

/**
 * 4. LOAD KOMENTAR (Fix Ikon Admin & Posisi Sejajar)
 */
window.loadComments = async (blogId) => {
    const { data: comments } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    const display = document.getElementById('comment-display');
    if (!display) return;
    display.innerHTML = '';

    comments.forEach(comment => {
        // ADMIN: user-round-check | MEMBER: user-round
        const isAdmin = comment.email === "admin@eec.com"; 
        const iconName = isAdmin ? 'user-round-check' : 'user-round';
        const iconColor = isAdmin ? 'var(--orange-yellow-crayola)' : 'var(--light-gray-70)';

        const timeDetail = new Date(comment.created_at).toLocaleString('id-ID', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const card = document.createElement('div');
        card.className = `comment-card`;
        
        // Inline style "margin-top: -2px" ditambahkan agar ikon naik sedikit & sejajar sempurna
        card.innerHTML = `
            <div class="comment-header" style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <i data-lucide="${iconName}" style="width: 14px; height: 14px; color: ${iconColor}; stroke-width: 2.5px; margin-top: -2px;"></i>
                <span class="comment-username" style="font-size: 13px; font-weight: 600; color: var(--white-2);">${comment.username}</span>
            </div>
            <p class="comment-text" style="font-size: 14px; color: var(--light-gray); padding-left: 20px;">${comment.content}</p>
            <div class="comment-footer" style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 4px;">
                <span style="font-size: 9px; color: var(--light-gray-70); opacity: 0.6;">${comment.email || ''}</span>
                <span style="font-size: 9px; color: var(--light-gray-70); opacity: 0.6;">•</span>
                <span style="font-size: 9px; color: var(--light-gray-70); opacity: 0.6;">${timeDetail}</span>
            </div>
        `;
        display.appendChild(card);
    });
    
    if (window.lucide) lucide.createIcons();
};

/**
 * 5. NOTIFIKASI & LOGOUT
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

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    showNotif("Logged out successfully");
    updateUI();
};

/**
 * 6. BLOG NAVIGATION
 */
window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    
    const contentDetail = document.getElementById('blog-content-detail');
    if (contentDetail) {
        contentDetail.innerHTML = `
            <h3 class="h3">Hello from EEC</h3>
            <p class="blog-text" style="color:var(--light-gray); margin-top:10px;">
                Wadah bagi para desainer eFootball untuk berbagi karya, inspirasi, dan teknik editing terbaru.
            </p>`;
    }
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

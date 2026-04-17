'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// --- SIDEBAR TOGGLE ---
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");
if (sidebarBtn) {
    sidebarBtn.onclick = () => sidebar.classList.toggle("active");
}

// --- NAVIGASI HALAMAN (Fix Account) ---
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");

    navLinks.forEach(link => {
        link.onclick = function() {
            const target = this.innerText.toLowerCase().trim();
            pages.forEach(p => p.classList.toggle('active', p.dataset.page === target));
            navLinks.forEach(l => l.classList.toggle('active', l === this));
            window.scrollTo(0, 0);
            if(target === 'account') updateUI();
        };
    });
    updateUI();
});

// --- UPDATE UI ACCOUNT ---
async function updateUI() {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    const commentForm = document.getElementById('comment-form');
    if (!container) return;

    if (!session) {
        container.innerHTML = `<div style="text-align:center;padding:40px;"><p style="color:var(--light-gray);margin-bottom:20px;">Masuk ke akun Anda</p><button class="form-btn" onclick="showAuthModal('login')">Sign In</button></div>`;
        if (commentForm) commentForm.style.display = 'none';
    } else {
        container.innerHTML = `<div style="text-align:center;"><h3 class="h3">${session.user.user_metadata.display_name || 'Member'}</h3><p style="color:var(--light-gray-70);font-size:13px;margin:10px 0 20px;">${session.user.email}</p><button class="form-btn secondary" onclick="handleLogout()">Sign Out</button></div>`;
        if (commentForm) commentForm.style.display = 'flex';
    }
}

// --- FITUR KOMENTAR & LOGO SEJAJAR ---
window.loadComments = async (blogId) => {
    const { data: comments } = await _supabase.from('comments').select('*').eq('blog_id', blogId).order('created_at', { ascending: true });
    const display = document.getElementById('comment-display');
    if (!display) return;
    display.innerHTML = '';

    comments.forEach(comment => {
        const isAdmin = comment.email === "admin@eec.com"; 
        const iconName = isAdmin ? 'user-round-check' : 'user-round';
        const iconColor = isAdmin ? 'var(--orange-yellow-crayola)' : 'var(--light-gray-70)';
        const time = new Date(comment.created_at).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

        const card = document.createElement('div');
        card.className = `comment-card`;
        card.innerHTML = `
            <div class="comment-header">
                <i data-lucide="${iconName}" style="width:14px; height:14px; color:${iconColor}; stroke-width:2.5px; margin-top:-2px;"></i>
                <span class="comment-username">${comment.username}</span>
            </div>
            <p class="comment-text">${comment.content}</p>
            <div class="comment-footer">
                <span>${comment.email}</span><span>•</span><span>${time}</span>
            </div>
        `;
        display.appendChild(card);
    });
    if (window.lucide) lucide.createIcons();
};

// --- SUBMIT KOMEN ---
document.getElementById('comment-form').onsubmit = async (e) => {
    e.preventDefault();
    const { data: { session } } = await _supabase.auth.getSession();
    const input = document.getElementById('comment-input');
    if (!session || !input.value.trim()) return;

    const { error } = await _supabase.from('comments').insert([{
        content: input.value, user_id: session.user.id,
        username: session.user.user_metadata.display_name || "Member",
        email: session.user.email, blog_id: 'hello-eec'
    }]);

    if (!error) { input.value = ''; loadComments('hello-eec'); }
};

window.handleLogout = async () => { await _supabase.auth.signOut(); updateUI(); };
window.openBlog = (id) => { 
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    loadComments(id); 
};
window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

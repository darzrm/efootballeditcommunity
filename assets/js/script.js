'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."; // Gunakan Key kamu
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// Fungsi Refresh Ikon
const refreshIcons = () => {
    if (window.lucide) {
        lucide.createIcons();
    }
};

// --- LOAD COMMENTS ---
window.loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    display.innerHTML = '<p>Loading comments...</p>';

    const { data: comments, error } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: true });

    if (error) {
        display.innerHTML = '<p>Failed to load comments.</p>';
        return;
    }

    const { data: { session } } = await _supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    display.innerHTML = comments.map(c => `
        <div class="comment-card ${c.user_id === currentUserId ? 'is-me' : ''}">
            <span class="comment-username">${c.username}</span>
            <p class="comment-text">${c.content}</p>
        </div>
    `).join('');
};

// --- AUTH UI UPDATE ---
const updateUI = async () => {
    const container = document.getElementById('account-content');
    const { data: { session } } = await _supabase.auth.getSession();

    if (!session) {
        container.innerHTML = `
            <p class="blog-text">Please login to join the community.</p>
            <button class="form-btn" onclick="showLoginModal()">Login / Register</button>
        `;
        document.getElementById('comment-form').style.display = 'none';
    } else {
        const user = session.user;
        container.innerHTML = `
            <p class="blog-text">Welcome, <strong>${user.user_metadata.display_name || 'Member'}</strong>!</p>
            <button class="form-btn secondary" onclick="_supabase.auth.signOut().then(() => location.reload())">Logout</button>
        `;
        document.getElementById('comment-form').style.display = 'flex';
    }
};

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();
    updateUI();

    // Navigasi
    const navLinks = document.querySelectorAll('[data-nav-link]');
    const pages = document.querySelectorAll('[data-page]');

    navLinks.forEach(link => {
        link.onclick = () => {
            const target = link.innerHTML.toLowerCase();
            pages.forEach(page => {
                if (page.dataset.page === target) {
                    page.classList.add('active');
                    link.classList.add('active');
                    if (target === 'account') updateUI();
                } else {
                    page.classList.remove('active');
                }
            });
            window.scrollTo(0, 0);
        };
    });
});

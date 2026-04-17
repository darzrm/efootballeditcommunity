'use strict';

const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * System Notification (Top & Minimalist)
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
        notif.style.top = '10px'; 
        setTimeout(() => notif.remove(), 500); 
    }, 2500);
};

/**
 * Global Modal
 */
window.showModal = (title, html, onConfirm) => {
    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-confirm-btn').onclick = onConfirm;
    document.getElementById('global-modal').classList.add('active');
};

window.closeGlobalModal = () => document.getElementById('global-modal').classList.remove('active');

/**
 * Account Management
 */
const updateUI = async () => {
    const { data: { session } } = await _supabase.auth.getSession();
    const container = document.getElementById('account-content');
    if (!container || !session) return;

    const user = session.user.user_metadata.display_name || "Member";
    const isAdmin = (session.user.email === 'darzrm@gmail.com');
    const joinDate = new Date(session.user.created_at).toLocaleDateString('en-GB');

    container.innerHTML = `
        <div style="text-align: center; width:100%;">
            <h3 class="h3">${user}</h3>
            <p class="blog-text">${session.user.email} | <b>${isAdmin ? 'Admin' : 'Member'}</b></p>
            <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
                <button class="form-btn" onclick="handleLogout()">Logout</button>
            </div>
        </div>`;
};

window.handleLogout = async () => {
    await _supabase.auth.signOut();
    showNotif("Logged out");
    setTimeout(() => location.reload(), 1000);
};

/**
 * Comments System
 */
const loadComments = async (blogId) => {
    const display = document.getElementById('comment-display');
    if (!display) return;

    const { data: { session } } = await _supabase.auth.getSession();
    const { data: comments, error } = await _supabase.from('comments')
        .select('*').eq('blog_id', blogId).order('created_at', { ascending: true });

    if (error) return;

    display.innerHTML = comments.map(c => {
        const isMe = session && session.user.id === c.user_id;
        const isAdmin = c.email === 'darzrm@gmail.com';
        const date = new Date(c.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        return `
            <div class="comment-card ${isMe ? 'is-me' : ''}">
                <div class="comment-header">
                    <span class="comment-username">${c.username}</span>
                    <span class="comment-email">${c.email || ''}</span>
                    ${isAdmin ? '<span style="font-size:8px; background:#ff4b4b; padding:1px 4px; border-radius:3px;">ADMIN</span>' : ''}
                </div>
                <p class="comment-text">${c.content}</p>
                <div class="comment-footer">
                    <span class="comment-date">${date}</span>
                </div>
            </div>
        `;
    }).join('');
};

/**
 * Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    
    // Sidebar Toggle
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    const sidebar = document.querySelector("[data-sidebar]");
    if (sidebarBtn) sidebarBtn.onclick = () => sidebar.classList.toggle("active");

    // Nav Logic
    document.querySelectorAll("[data-nav-link]").forEach(link => {
        link.onclick = function() {
            const page = this.innerText.toLowerCase();
            document.querySelectorAll("[data-page]").forEach(p => p.classList.toggle('active', p.dataset.page === page));
            document.querySelectorAll("[data-nav-link]").forEach(l => l.classList.toggle('active', l === this));
            if (page === 'account') updateUI();
        };
    });

    // Submit Comment
    const form = document.getElementById('comment-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.getElementById('comment-input');
            if (!session || !input.value.trim()) return;

            const { error } = await _supabase.from('comments').insert([{
                content: input.value,
                user_id: session.user.id,
                username: session.user.user_metadata.display_name || "Member",
                email: session.user.email,
                blog_id: 'hello-eec'
            }]);

            if (!error) { input.value = ''; loadComments('hello-eec'); showNotif("Sent!"); }
        };
    }
});

window.openBlog = (id) => {
    document.getElementById('blog-list-container').style.display = 'none';
    document.getElementById('blog-detail-container').style.display = 'block';
    loadComments(id);
};

window.closeBlog = () => {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
};

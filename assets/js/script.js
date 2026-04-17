'use strict';

/**
 * 1. KONFIGURASI SUPABASE
 */
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

// State untuk Modal
let isSignUpMode = false;

/**
 * 2. FUNGSI UI & MODAL AUTH
 */

window.openAuthModal = function() {
    document.getElementById('custom-auth-modal').classList.add('active');
}

window.closeAuthModal = function() {
    document.getElementById('custom-auth-modal').classList.remove('active');
}

window.changeUsername = function() {
    const current = localStorage.getItem('eec_username') || "User";
    const newName = prompt("Masukkan Username Baru:", current);
    if (newName && newName.trim() !== "") {
        localStorage.setItem('eec_username', newName.trim());
        alert("Username diperbarui!");
        location.reload();
    }
}

/**
 * 3. FUNGSI ADMIN (HAPUS KOMENTAR)
 */
window.deleteComment = async function(commentId) {
    const currentUsername = localStorage.getItem('eec_username');
    
    if (currentUsername !== 'dariraa') {
        alert("Akses Ditolak: Anda bukan admin.");
        return;
    }

    if (confirm("Hapus komentar ini?")) {
        const { error } = await _supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (!error) {
            loadComments('hello-eec');
        } else {
            alert("Gagal menghapus: " + error.message);
        }
    }
}

/**
 * 4. FUNGSI BACKEND (CHECK USER & KOMENTAR)
 */

async function checkUser() {
    const btnAuth = document.querySelector("#btn-auth");
    const userStatus = document.querySelector("#user-status");
    const commentForm = document.querySelector("#comment-form");
    const loginWarn = document.querySelector("#login-warn");

    const { data: { session } } = await _supabase.auth.getSession();
    
    if (session && btnAuth) {
        const savedName = localStorage.getItem('eec_username') || session.user.email.split('@')[0];
        
        // Logika Mahkota Admin di Sidebar
        const crown = (savedName === 'dariraa') ? `<ion-icon name="medal" style="color: #ffdb70; margin-left: 5px;"></ion-icon>` : '';

        userStatus.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: var(--white-2); font-weight: 600; display: flex; align-items: center;">
                    ${savedName} ${crown}
                </span>
                <span onclick="changeUsername()" style="color: var(--orange-yellow-crayola); font-size: 10px; cursor: pointer; text-decoration: underline;">
                    Ubah Username
                </span>
            </div>
        `;
        
        btnAuth.innerHTML = '<ion-icon name="log-out-outline"></ion-icon><span>Logout</span>';
        if (commentForm) commentForm.style.display = "block";
        if (loginWarn) loginWarn.style.display = "none";
        return session.user;
    }
    return null;
}

async function loadComments(blogId = 'hello-eec') {
    const display = document.getElementById('comment-display');
    if (!display) return;

    const currentUsername = localStorage.getItem('eec_username');
    const isAdmin = (currentUsername === 'dariraa');

    const { data, error } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

    if (data) {
        display.innerHTML = data.length ? data.map(c => {
            const isOwnerAdmin = (c.username === 'dariraa');
            const crownIcon = isOwnerAdmin ? `<ion-icon name="medal" style="color: #ffdb70; margin-left: 5px; vertical-align: middle;"></ion-icon>` : '';
            const deleteBtn = isAdmin ? `<button onclick="deleteComment('${c.id}')" style="float: right; color: #ff4b4b; background: none; border: 1px solid #ff4b4b; padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">Hapus</button>` : '';

            return `
                <div class="comment-card" style="background: var(--bg-gradient-jet); padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid var(--orange-yellow-crayola);">
                    ${deleteBtn}
                    <p style="color: var(--orange-yellow-crayola); font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                        ${c.username || 'Anonymous'} ${crownIcon}
                    </p>
                    <p style="color: var(--light-gray-70); font-size: 10px; margin-bottom: 8px;">
                        ${new Date(c.created_at).toLocaleString('id-ID')}
                    </p>
                    <p style="color: var(--light-gray); font-size: 14px; line-height: 1.6;">
                        ${c.content}
                    </p>
                </div>
            `;
        }).join('') : '<p class="blog-text">Belum ada komentar.</p>';
    }
}

/**
 * 5. LOGIKA BLOG
 */
window.openBlog = function(blogId) {
    const list = document.getElementById('blog-list-container');
    const detail = document.getElementById('blog-detail-container');
    
    if (list && detail) {
        list.style.display = 'none';
        detail.style.display = 'block';

        const detailContainer = document.getElementById('blog-content-detail');
        if(blogId === 'hello-eec') {
            detailContainer.innerHTML = `
                <figure class="blog-banner-box" style="margin-bottom: 20px;">
                    <img src="./assets/images/g1.jpg" style="width: 100%; border-radius: 16px;">
                </figure>
                <h3 class="h3 blog-item-title" style="margin-bottom: 10px;">Hello from EEC</h3>
                <p class="blog-text" style="color: var(--light-gray);">
                    Komunitas editor eFootball resmi dibuka! Mari berbagi aset dan teknik editing bersama.
                </p>
            `;
        }
        loadComments(blogId);
    }
}

window.closeBlog = function() {
    document.getElementById('blog-list-container').style.display = 'block';
    document.getElementById('blog-detail-container').style.display = 'none';
}

/**
 * 6. INIT & EVENT LISTENERS
 */
document.addEventListener("DOMContentLoaded", () => {
    checkUser();

    // Sidebar Toggle
    const sidebar = document.querySelector("[data-sidebar]");
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn) {
        sidebarBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
    }

    // Navbar Toggle
    const navigationLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");
    navigationLinks.forEach((link, i) => {
        link.addEventListener("click", function() {
            const target = this.innerHTML.toLowerCase();
            pages.forEach((page, j) => {
                if (target === page.dataset.page) {
                    page.classList.add("active");
                    navigationLinks[j].classList.add("active");
                } else {
                    page.classList.remove("active");
                    navigationLinks[j].classList.remove("active");
                }
            });
            window.scrollTo(0, 0);
        });
    });

    // Auth Button Login/Logout
    const btnAuth = document.getElementById("btn-auth");
    if (btnAuth) {
        btnAuth.addEventListener("click", async () => {
            const { data: { session } } = await _supabase.auth.getSession();
            if (session) {
                await _supabase.auth.signOut();
                location.reload();
            } else {
                openAuthModal();
            }
        });
    }

    // Switch Modal Login/Daftar
    const switchAuth = document.getElementById('switch-auth-mode');
    if (switchAuth) {
        switchAuth.onclick = () => {
            isSignUpMode = !isSignUpMode;
            document.getElementById('auth-modal-title').innerText = isSignUpMode ? "Daftar Akun" : "Selamat Datang";
            document.getElementById('modal-username').style.display = isSignUpMode ? "block" : "none";
            switchAuth.innerHTML = isSignUpMode ? 
                "Sudah punya akun? <span style='color:var(--orange-yellow-crayola)'>Login</span>" : 
                "Belum punya akun? <span style='color:var(--orange-yellow-crayola)'>Daftar</span>";
        };
    }

    // Submit Modal Auth
    const modalSubmit = document.getElementById('modal-submit-btn');
    if (modalSubmit) {
        modalSubmit.onclick = async () => {
            const email = document.getElementById('modal-email').value;
            const pass = document.getElementById('modal-pass').value;
            const username = document.getElementById('modal-username').value;

            if (isSignUpMode) {
                const { error } = await _supabase.auth.signUp({ email, password: pass });
                if (error) return alert(error.message);
                localStorage.setItem('eec_username', username || email.split('@')[0]);
                alert("Daftar berhasil!");
            } else {
                const { error } = await _supabase.auth.signInWithPassword({ email, password: pass });
                if (error) return alert("Email/Password salah!");
            }
            location.reload();
        };
    }

    // Submit Komentar
    const commentForm = document.getElementById("comment-form");
    if (commentForm) {
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.getElementById("comment-input");
            
            if (!session) return alert("Login dulu!");

            const currentUsername = localStorage.getItem('eec_username') || session.user.email.split('@')[0];

            const { error } = await _supabase.from('comments').insert([{ 
                content: input.value, 
                user_id: session.user.id,
                username: currentUsername,
                blog_id: 'hello-eec' 
            }]);

            if (!error) {
                input.value = "";
                loadComments('hello-eec');
            } else {
                alert("Gagal kirim: " + error.message);
            }
        });
    }
});

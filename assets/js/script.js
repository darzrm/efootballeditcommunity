'use strict';

/**
 * 1. KONFIGURASI SUPABASE
 */
const SB_URL = "https://ijdzjhmtlblpsaxcseym.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqZHpqaG10bGJscHNheGNzZXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzOTQ4MTcsImV4cCI6MjA5MTk3MDgxN30.46pqbTLsqVIzIA4tu0DuxovIt0pJZNAypWHWxRDV5IY";
const _supabase = supabase.createClient(SB_URL, SB_KEY);

/**
 * 2. FUNGSI USERNAME (LOCAL STORAGE)
 */
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
 * 3. FUNGSI BACKEND (LOGIN & KOMENTAR)
 */

async function checkUser() {
    const btnAuth = document.querySelector("#btn-auth");
    const userStatus = document.querySelector("#user-status");
    const commentForm = document.querySelector("#comment-form");
    const loginWarn = document.querySelector("#login-warn");

    const { data: { session } } = await _supabase.auth.getSession();
    
    if (session && btnAuth) {
        // Ambil nama dari localStorage, jika kosong pakai potongan email
        const savedName = localStorage.getItem('eec_username') || session.user.email.split('@')[0];
        
        // Update Sidebar UI
        userStatus.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: var(--white-2); font-weight: 600;">${savedName}</span>
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

    const { data, error } = await _supabase
        .from('comments')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

    if (data) {
        display.innerHTML = data.length ? data.map(c => `
            <div class="comment-card" style="background: var(--bg-gradient-jet); padding: 15px; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid var(--orange-yellow-crayola);">
                <p style="color: var(--orange-yellow-crayola); font-weight: 600; font-size: 14px; margin-bottom: 4px;">
                    ${c.username || 'Anonymous'}
                </p>
                <p style="color: var(--light-gray-70); font-size: 10px; margin-bottom: 8px;">
                    ${new Date(c.created_at).toLocaleString('id-ID')}
                </p>
                <p style="color: var(--light-gray); font-size: 14px; line-height: 1.6;">
                    ${c.content}
                </p>
            </div>
        `).join('') : '<p class="blog-text">Belum ada komentar.</p>';
    }
}

/**
 * 4. LOGIKA BLOG SWITCH
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
                    Pada hari ini, komunitas EEC resmi dibentuk sebagai awal dari perjalanan kreatif untuk saling menginspirasi dan tumbuh bersama. Kami percaya bahwa setiap kreator memiliki potensi besar.
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
 * 5. INISIALISASI (DOM CONTENT LOADED)
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- SIDEBAR TOGGLE ---
    const sidebar = document.querySelector("[data-sidebar]");
    const sidebarBtn = document.querySelector("[data-sidebar-btn]");
    if (sidebarBtn) {
        sidebarBtn.addEventListener("click", () => sidebar.classList.toggle("active"));
    }

    // --- NAVIGATION ---
    const navigationLinks = document.querySelectorAll("[data-nav-link]");
    const pages = document.querySelectorAll("[data-page]");
    navigationLinks.forEach((link) => {
        link.addEventListener("click", function() {
            const targetPage = this.innerHTML.toLowerCase();
            pages.forEach((page, i) => {
                if (targetPage === page.dataset.page) {
                    page.classList.add("active");
                    navigationLinks[i].classList.add("active");
                } else {
                    page.classList.remove("active");
                    navigationLinks[i].classList.remove("active");
                }
            });
            window.scrollTo(0, 0);
        });
    });

    // --- SORT TABEL OTOMATIS ---
    const tableBody = document.querySelector("#myTable tbody");
    if (tableBody) {
        const rows = Array.from(tableBody.querySelectorAll("tr"));
        rows.sort((a, b) => parseInt(b.children[2].textContent || 0) - parseInt(a.children[2].textContent || 0));
        tableBody.innerHTML = "";
        rows.forEach((row, i) => {
            row.children[0].textContent = i + 1;
            tableBody.appendChild(row);
        });
    }

    // --- AUTH LOGIC ---
    checkUser();
    const btnAuth = document.querySelector("#btn-auth");
    if (btnAuth) {
        btnAuth.addEventListener("click", async () => {
            const { data: { session } } = await _supabase.auth.getSession();
            if (session) {
                await _supabase.auth.signOut();
                location.reload();
            } else {
                const email = prompt("Email:");
                const pass = prompt("Password (min. 6 karakter):");
                if (email && pass) {
                    const { error: loginErr } = await _supabase.auth.signInWithPassword({ email, password: pass });
                    if (loginErr) {
                        const { error: signUpErr } = await _supabase.auth.signUp({ email, password: pass });
                        if (signUpErr) alert(signUpErr.message);
                        else alert("Daftar berhasil! Silakan login ulang.");
                    }
                    location.reload();
                }
            }
        });
    }

    // --- SUBMIT KOMENTAR ---
    const commentForm = document.querySelector("#comment-form");
    if (commentForm) {
        commentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const { data: { session } } = await _supabase.auth.getSession();
            const input = document.querySelector("#comment-input");
            
            if (!session) return alert("Login dulu!");

            const currentUsername = localStorage.getItem('eec_username') || session.user.email.split('@')
document.addEventListener("DOMContentLoaded", () => {
    // Tambahkan log ini untuk memastikan JS jalan
    console.log("Website siap, Supabase terhubung!");

    checkUser();
    
    // Logika tombol login yang lebih kuat
    const btnAuth = document.getElementById("btn-auth");
    if (btnAuth) {
        btnAuth.onclick = async () => {
            console.log("Tombol Auth diklik");
            // ... isi logika login kamu ...
        };
    }
});

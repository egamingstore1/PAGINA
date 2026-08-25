document.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
    setupOutsideClick();
});

// ==========================================
// CONTROL DE MODALES
// ==========================================
function openAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.add("active");
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.remove("active");
}

function closeProfileModal() {
    const modal = document.getElementById("profileModal");
    if (modal) modal.classList.remove("active");
}

function switchAuthTab(tab) {
    const tabLogin = document.getElementById("tabLoginBtn");
    const tabRegister = document.getElementById("tabRegisterBtn");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (tab === 'login') {
        if (tabLogin) {
            tabLogin.style.borderColor = "#00f2fe";
            tabLogin.style.color = "#fff";
        }
        if (tabRegister) {
            tabRegister.style.borderColor = "#2d3748";
            tabRegister.style.color = "#8a99ad";
        }
        if (loginForm) loginForm.style.display = "block";
        if (registerForm) registerForm.style.display = "none";
    } else {
        if (tabRegister) {
            tabRegister.style.borderColor = "#00f2fe";
            tabRegister.style.color = "#fff";
        }
        if (tabLogin) {
            tabLogin.style.borderColor = "#2d3748";
            tabLogin.style.color = "#8a99ad";
        }
        if (loginForm) loginForm.style.display = "none";
        if (registerForm) registerForm.style.display = "block";
    }
}

function togglePasswordVisibility(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

// ==========================================
// ESTADO DE SESIÓN Y MENÚ DE USUARIO
// ==========================================
function checkAuthState() {
    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
    const btnLogin = document.getElementById("btnLoginTrigger");
    const userMenu = document.getElementById("userProfileMenu");
    const adminBtn = document.getElementById("adminDropdownItem");
    const navUsername = document.getElementById("navUsername");
    const navAvatar = document.getElementById("navAvatar");

    if (usuarioActivo) {
        if (btnLogin) btnLogin.style.display = "none";
        if (userMenu) userMenu.style.display = "flex";

        const nombreMostrar = usuarioActivo.name || usuarioActivo.username || "Usuario";
        if (navUsername) navUsername.textContent = nombreMostrar;
        
        if (navAvatar) {
            if (usuarioActivo.picture) {
                navAvatar.innerHTML = `<img src="${usuarioActivo.picture}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                navAvatar.textContent = nombreMostrar.charAt(0).toUpperCase();
            }
        }

        // Acceso al Panel Admin únicamente para el correo autorizado
        if (adminBtn) {
            const esAdmin = usuarioActivo.email && usuarioActivo.email.toLowerCase().trim() === 'jmra2208@gmail.com';
            adminBtn.style.display = esAdmin ? 'block' : 'none';
        }
    } else {
        if (btnLogin) btnLogin.style.display = "inline-flex";
        if (userMenu) userMenu.style.display = "none";
        if (adminBtn) adminBtn.style.display = "none";
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById("profileDropdown");
    if (dropdown) dropdown.classList.toggle("active");
}

function setupOutsideClick() {
    document.addEventListener("click", (e) => {
        const userMenu = document.getElementById("userProfileMenu");
        const dropdown = document.getElementById("profileDropdown");
        const searchWrapper = document.querySelector(".nav-search");
        const suggestionsBox = document.getElementById("searchSuggestions");

        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.remove("active");
        }

        if (searchWrapper && suggestionsBox && !searchWrapper.contains(e.target)) {
            suggestionsBox.style.display = "none";
        }
    });
}

function logoutUser() {
    localStorage.removeItem("usuarioActivo");
    window.location.reload();
}

// ==========================================
// MANEJADOR Y DECODIFICADOR DE GOOGLE
// ==========================================
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);

    if (responsePayload && responsePayload.email_verified) {
        const emailVerificado = responsePayload.email.toLowerCase().trim();
        const nombreUsuario = responsePayload.name || responsePayload.given_name;

        const usuarioValido = {
            name: nombreUsuario,
            email: emailVerificado,
            picture: responsePayload.picture,
            id: responsePayload.sub
        };

        localStorage.setItem("usuarioActivo", JSON.stringify(usuarioValido));

        closeAuthModal();
        checkAuthState();

        mostrarNotificacionGamer(`⚡ ¡Verificado correctamente como ${nombreUsuario}!`);
    } else {
        mostrarNotificacionGamer("❌ No se pudo verificar la cuenta de Google.");
    }
}

// ==========================================
// AUTENTICACIÓN MANUAL (SOLO ADMIN)
// ==========================================
function handleLogin(event) {
    event.preventDefault();
    
    const emailInput = document.getElementById('loginEmail').value.trim();
    const passwordInput = document.getElementById('loginPassword').value.trim();

    if (emailInput.toLowerCase() === 'jmra2208@gmail.com' && passwordInput === '1234567') {
        const usuarioAdmin = {
            name: "Administrador",
            email: "jmra2208@gmail.com",
            phone: "+58 000 0000000",
            id: "ADM-001"
        };

        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioAdmin));
        closeAuthModal();
        checkAuthState();
        mostrarNotificacionGamer("⚡ ¡Sesión de Administrador iniciada!");
    } else {
        mostrarNotificacionGamer("❌ Para usuarios normales, utiliza el botón oficial de Google.");
    }
}

function handleRegister(event) {
    event.preventDefault();
    mostrarNotificacionGamer("⚠️ Utiliza el botón de Google para crear una cuenta verificada.");
}

// ==========================================
// BUSCADOR DIRECTO EN TIEMPO REAL
// ==========================================
function filtrarJuegosDirecto() {
    const input = document.getElementById("searchInput").value.toLowerCase().trim();
    const suggestionsBox = document.getElementById("searchSuggestions");
    const cards = document.querySelectorAll(".game-card");
    const noResults = document.getElementById("noResults");
    
    if (!suggestionsBox) return;

    suggestionsBox.innerHTML = "";

    if (input === "") {
        suggestionsBox.style.display = "none";
        cards.forEach(card => card.style.display = "flex");
        if (noResults) noResults.style.display = "none";
        return;
    }

    let matches = [];

    cards.forEach(card => {
        const title = card.getAttribute("data-title") || "";
        const nameEl = card.querySelector("h4");
        const imgEl = card.querySelector("img");
        const name = nameEl ? nameEl.innerText : "";
        const imgSrc = imgEl ? imgEl.src : "";
        const href = card.getAttribute("href") || "#";

        if (title.toLowerCase().includes(input) || name.toLowerCase().includes(input)) {
            card.style.display = "flex";
            matches.push({ name, imgSrc, href });
        } else {
            card.style.display = "none";
        }
    });

    if (matches.length > 0) {
        matches.forEach(item => {
            const a = document.createElement("a");
            a.href = item.href;
            a.className = "search-item-suggestion";
            a.style.cssText = "display: flex; align-items: center; gap: 12px; padding: 10px 15px; color: #ffffff; text-decoration: none; border-bottom: 1px solid rgba(255, 255, 255, 0.05);";
            a.innerHTML = `
                <img src="${item.imgSrc}" alt="${item.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <span style="font-size: 0.9rem; font-weight: 600;">${item.name}</span>
            `;
            suggestionsBox.appendChild(a);
        });
        suggestionsBox.style.cssText = "display: block; position: absolute; top: calc(100% + 8px); left: 0; width: 100%; background: #161b22; border: 1px solid rgba(0, 242, 254, 0.3); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.6); z-index: 1000; overflow: hidden; max-height: 300px; overflow-y: auto;";
        if (noResults) noResults.style.display = "none";
    } else {
        suggestionsBox.style.display = "none";
        if (noResults) noResults.style.display = "block";
    }
}

// ==========================================
// NOTIFICACIONES FLOTANTES (TOAST)
// ==========================================
function mostrarNotificacionGamer(mensaje) {
    const notifExistente = document.getElementById('toastGamer');
    if (notifExistente) notifExistente.remove();

    const toast = document.createElement('div');
    toast.id = 'toastGamer';
    toast.innerHTML = mensaje;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        color: '#00f2fe',
        border: '1px solid #00f2fe',
        padding: '12px 24px',
        borderRadius: '10px',
        boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        zIndex: '10000',
        transition: 'all 0.4s ease',
        opacity: '0',
        transform: 'translateY(20px)'
    });

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==========================================
// GESTIÓN DEL MODAL DE PERFIL E HISTORIAL
// ==========================================
function openProfileModal() {
    const modal = document.getElementById("profileModal");
    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));

    if (!usuarioActivo) {
        mostrarNotificacionGamer("⚠️ Inicia sesión para ver tu perfil e historial.");
        openAuthModal();
        return;
    }

    const profName = document.getElementById("profileName");
    const profEmail = document.getElementById("profileEmail");
    const profAvatar = document.getElementById("profileAvatar");

    if (profName) profName.textContent = usuarioActivo.name || usuarioActivo.username || "Usuario";
    if (profEmail) profEmail.textContent = usuarioActivo.email || "";
    
    if (profAvatar) {
        if (usuarioActivo.picture) {
            profAvatar.innerHTML = `<img src="${usuarioActivo.picture}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
        } else {
            profAvatar.textContent = (usuarioActivo.name || "U").charAt(0).toUpperCase();
        }
    }

    cargarHistorialUsuario(usuarioActivo);

    if (modal) modal.classList.add("active");
}

function cargarHistorialUsuario(usuario) {
    const contenedorHistorial = document.getElementById("userOrdersHistory");
    if (!contenedorHistorial) return;

    const todasLasOrdenes = JSON.parse(localStorage.getItem("ordenesRecarga")) || [];

    const misOrdenes = todasLasOrdenes.filter(ord => {
        if (usuario.email && ord.idUsuario) {
            return ord.idUsuario.toLowerCase().trim() === usuario.email.toLowerCase().trim();
        }
        return ord.idUsuario === usuario.id;
    });

    if (misOrdenes.length === 0) {
        contenedorHistorial.innerHTML = `
            <div style="text-align: center; color: #8a99ad; padding: 20px;">
                <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 8px;"></i>
                <p>Aún no has realizado ninguna recarga.</p>
            </div>
        `;
        return;
    }

    contenedorHistorial.innerHTML = "";
    misOrdenes.reverse().forEach(ord => {
        const item = document.createElement("div");
        item.className = "order-history-item";
        item.style.cssText = "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;";

        const estado = (ord.estado || "pendiente").toLowerCase();
        let badgeColor = "#f1c40f";
        let estadoTexto = "PENDIENTE";

        if (estado === "completado" || estado === "aprobado") {
            badgeColor = "#2ecc71";
            estadoTexto = "COMPLETADO";
        } else if (estado === "rechazado") {
            badgeColor = "#e74c3c";
            estadoTexto = "RECHAZADO";
        }

        item.innerHTML = `
            <div>
                <strong style="color: #fff; font-size: 0.95rem;">${ord.juego || "Recarga"}</strong> - <small style="color: #00f2fe;">${ord.paquete || ""}</small>
                <div style="font-size: 0.8rem; color: #8a99ad; margin-top: 4px;">
                    ID Juego: <span style="color: #fff;">${ord.playerId || "N/A"}</span> | Ref: <code>${ord.referencia || "S/R"}</code>
                </div>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 0.95rem; font-weight: bold; color: #fff;">${ord.montoBs || "0"} Bs</span>
                <div style="font-size: 0.75rem; font-weight: bold; color: ${badgeColor}; margin-top: 4px; padding: 2px 6px; background: rgba(0,0,0,0.3); border-radius: 4px; display: inline-block;">
                    ${estadoTexto}
                </div>
            </div>
        `;

        contenedorHistorial.appendChild(item);
    });
}
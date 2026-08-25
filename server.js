require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.'));



const SENDER_EMAIL = process.env.SENDER_EMAIL;

const RECV_EMAIL = process.env.EMAIL_RECV;


let authCodes = {};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: process.env.EMAIL_PASS // Lee la contraseña desde el .env
    }
});

// ==========================================
//  BASE DE DATOS Y GESTIÓN DE JUEGOS
// ==========================================
const DB_PATH = path.join(__dirname, 'juegos.json');

// Lista por defecto en caso de no existir el archivo juegos.json
const juegosIniciales = [
    {
        id: 'roblox',
        nombre: 'Roblox',
        imagen: 'img/roblox.png',
        url: 'roblox.html',
        activo: true,
        paquetes: [
            { id: 'precio-1', nombre: '80 Robux', usd: 1.00, activo: true },
            { id: 'precio-2', nombre: '400 Robux', usd: 5.00, activo: true },
            { id: 'precio-3', nombre: '800 Robux', usd: 10.00, activo: true },
            { id: 'precio-4', nombre: '1700 Robux', usd: 20.00, activo: true }
        ]
    },
    {
        id: 'blood-strike',
        nombre: 'Blood Strike',
        imagen: 'img/blood-strike.png',
        url: 'blood-strike.html',
        activo: true,
        paquetes: [
            { id: 'bs-1', nombre: 100, usd: 0.99, activo: true },
            { id: 'bs-2', nombre: 500, usd: 4.99, activo: true }
        ]
    }
];

// Función para cargar los juegos desde el archivo JSON
function cargarJuegos() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(juegosIniciales, null, 2));
        return juegosIniciales;
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return juegosIniciales;
    }
}

// Función para guardar cambios en el JSON
function guardarJuegos(juegos) {
    fs.writeFileSync(DB_PATH, JSON.stringify(juegos, null, 2));
}

// 1. Obtener lista completa de juegos (para index y checkout)
app.get('/api/juegos', (req, res) => {
    const juegos = cargarJuegos();
    res.json(juegos);
});

// 2. Actualizar estado (activo/desactivo) o precio de un juego o sus paquetes
app.put('/api/admin/juegos/:id', (req, res) => {
    const { id } = req.params;
    const { activo, paquetes } = req.body;
    let juegos = cargarJuegos();

    const juegoIndex = juegos.findIndex(j => j.id === id);
    if (juegoIndex === -1) {
        return res.status(404).json({ success: false, message: 'Juego no encontrado' });
    }

    if (typeof activo === 'boolean') {
        juegos[juegoIndex].activo = activo;
    }

    if (paquetes && Array.isArray(paquetes)) {
        juegos[juegoIndex].paquetes = paquetes;
    }

    guardarJuegos(juegos);
    res.json({ success: true, message: 'Juego actualizado correctamente', juego: juegos[juegoIndex] });
});


// ==========================================
//  PROCESAR PAGO Y ENVIAR NOTIFICACIÓN
// ==========================================
app.post('/api/confirmar-pago', (req, res) => {
    const orden = req.body; // Recibe todos los datos enviados desde checkout.html

    // Diseño del correo en HTML (estilo oscuro acorde a E Gaming Store)
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 25px; background-color: #07090e; color: #f1f5f9; max-width: 600px; margin: auto; border: 2px solid #00d2ff; border-radius: 12px;">
            <h2 style="color: #00d2ff; text-align: center; text-transform: uppercase;">🚀 Nuevo Pago Reportado</h2>
            <hr style="border: 1px solid rgba(0, 210, 255, 0.3); margin-bottom: 20px;">
            
            <div style="background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 10px;">
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>🎮 Juego:</strong> ${orden.juego}</p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>👤 ID Jugador:</strong> ${orden.id}</p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>📦 Paquete:</strong> ${orden.paquete}</p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>🏦 Banco Emisor:</strong> ${orden.banco}</p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>🧾 Ref / Pago Móvil:</strong> <span style="color: #00ff88; font-weight: bold;">${orden.referencia}</span></p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>💵 Monto Total:</strong> <span style="color: #00d2ff; font-weight: bold;">${orden.monto}</span></p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>🕒 Fecha/Hora:</strong> ${orden.creado}</p>
                <p style="margin: 10px 0; font-size: 1.05rem;"><strong>📊 Estado:</strong> <span style="color: #ffd700;">${orden.estado}</span></p>
            </div>
            
            <p style="text-align: center; color: #94a3b8; font-size: 0.85rem; margin-top: 25px;">
                E GAMING STORE - Mensaje automático del sistema.
            </p>
        </div>
    `;

    // Configuración del envío
    const mailOptions = {
        from: '"E Gaming Store" <' + SENDER_EMAIL + '>', // Remitente
        to: RECV_EMAIL, // Se enviará a (El SENDER_EMAIL que tienes al inicio)
        subject: `💰 Nuevo Pago: ${orden.juego} - Ref #${orden.referencia}`,
        html: htmlContent
    };

    // Ejecuta el envío de correo
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error al enviar el correo:', error);
            // Si el correo falla, igual respondemos error 500 para controlarlo en frontend si quisieras
            return res.status(500).json({ success: false, message: 'Error procesando el correo' });
        }
        
        console.log('Reporte enviado correctamente por correo:', info.response);
        // Responde al checkout.html que todo salió perfecto
        res.status(200).json({ success: true, message: 'Orden registrada y correo enviado.' });
    });
});


// ==========================================
//  AUTENTICACIÓN
// ==========================================
app.post('/api/auth/login-request', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Ingresa un correo válido' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    authCodes[email.toLowerCase()] = code;

    const mailOptions = {
        from: SENDER_EMAIL,
        to: email,
        subject: 'Código de Acceso - E GAMING STORE',
        text: `Tu código de acceso es: ${code}`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ success: false, message: 'Error al enviar el correo.' });
        }
        res.json({ success: true, message: 'Código enviado a tu correo.' });
    });
});

app.post('/api/auth/verify-code', (req, res) => {
    const { email, code } = req.body;
    const cleanEmail = email.toLowerCase();

    if (authCodes[cleanEmail] && authCodes[cleanEmail] === code) {
        delete authCodes[cleanEmail];

        const isAdmin = (cleanEmail === RECV_EMAIL.toLowerCase());

        return res.json({
            success: true,
            user: {
                email: cleanEmail,
                role: isAdmin ? 'admin' : 'client'
            },
            token: isAdmin ? 'ADMIN_SESSION_TOKEN_9988' : 'CLIENT_SESSION_TOKEN_1122'
        });
    } else {
        return res.status(401).json({ success: false, message: 'Código incorrecto o expirado.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
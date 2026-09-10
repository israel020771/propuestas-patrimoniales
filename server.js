const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_muy_segura_cambiar_en_produccion';
const DB_PATH = process.env.DB_PATH || './propuestas.db';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Inicializar base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Error conectando a BD:', err);
    else console.log('✓ Conectado a SQLite');
});

// Crear tablas si no existen
db.serialize(() => {
    // Tabla de usuarios
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullName TEXT,
            role TEXT DEFAULT 'agent',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
        )
    `);

    // Tabla de propuestas
    db.run(`
        CREATE TABLE IF NOT EXISTS proposals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            familyName TEXT NOT NULL,
            objective TEXT,
            consultant TEXT,
            proposalData TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    `);

    // Crear usuario admin por defecto
    const adminUser = {
        username: 'admin',
        email: 'admin@seguros.local',
        password: bcrypt.hashSync('Admin123!', 10),
        fullName: 'Administrador',
        role: 'admin'
    };

    db.get('SELECT id FROM users WHERE username = ?', ['admin'], (err, row) => {
        if (!row) {
            db.run(
                'INSERT INTO users (username, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
                [adminUser.username, adminUser.email, adminUser.password, adminUser.fullName, adminUser.role],
                (err) => {
                    if (!err) console.log('✓ Usuario admin creado (admin/Admin123!)');
                }
            );
        }
    });
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
        req.user = user;
        next();
    });
};

// ============ AUTENTICACIÓN ============

app.post('/api/auth/register', (req, res) => {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
        'INSERT INTO users (username, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, fullName || username, 'agent'],
        function(err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            res.json({ success: true, userId: this.lastID });
        }
    );
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username y password requeridos' });
    }

    db.get('SELECT * FROM users WHERE username = ? AND active = 1', [username], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, fullName: user.fullName, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
    });
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
    res.json(req.user);
});

// ============ PROPUESTAS ============

app.get('/api/proposals', authenticateToken, (req, res) => {
    db.all(
        'SELECT id, familyName, consultant, createdAt, updatedAt FROM proposals WHERE userId = ? ORDER BY updatedAt DESC',
        [req.user.id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows || []);
        }
    );
});

app.get('/api/proposals/:id', authenticateToken, (req, res) => {
    db.get(
        'SELECT * FROM proposals WHERE id = ? AND userId = ?',
        [req.params.id, req.user.id],
        (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!row) return res.status(404).json({ error: 'Propuesta no encontrada' });

            row.proposalData = JSON.parse(row.proposalData);
            res.json(row);
        }
    );
});

app.post('/api/proposals', authenticateToken, (req, res) => {
    const { familyName, objective, consultant, proposalData } = req.body;

    if (!familyName || !proposalData) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    db.run(
        'INSERT INTO proposals (userId, familyName, objective, consultant, proposalData) VALUES (?, ?, ?, ?, ?)',
        [req.user.id, familyName, objective, consultant, JSON.stringify(proposalData)],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/proposals/:id', authenticateToken, (req, res) => {
    const { familyName, objective, consultant, proposalData } = req.body;

    db.run(
        'UPDATE proposals SET familyName = ?, objective = ?, consultant = ?, proposalData = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?',
        [familyName, objective, consultant, JSON.stringify(proposalData), req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Propuesta no encontrada' });
            res.json({ success: true });
        }
    );
});

app.delete('/api/proposals/:id', authenticateToken, (req, res) => {
    db.run(
        'DELETE FROM proposals WHERE id = ? AND userId = ?',
        [req.params.id, req.user.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Propuesta no encontrada' });
            res.json({ success: true });
        }
    );
});

// ============ ADMINISTRACIÓN ============

app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos' });
    }

    db.all('SELECT id, username, email, fullName, role, createdAt, active FROM users', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

app.post('/api/admin/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos' });
    }

    const { username, email, password, fullName, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password || 'Temp123!', 10);

    db.run(
        'INSERT INTO users (username, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
        [username, email, hashedPassword, fullName || username, role || 'agent'],
        function(err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, success: true });
        }
    );
});

app.put('/api/admin/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos' });
    }

    const { active, role } = req.body;
    db.run(
        'UPDATE users SET active = ?, role = ? WHERE id = ?',
        [active, role, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

app.get('/api/admin/stats', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos' });
    }

    db.get('SELECT COUNT(*) as totalUsers FROM users', (err1, users) => {
        db.get('SELECT COUNT(*) as totalProposals FROM proposals', (err2, proposals) => {
            if (err1 || err2) return res.status(500).json({ error: 'Error' });
            res.json({ totalUsers: users.totalUsers, totalProposals: proposals.totalProposals });
        });
    });
});

// ============ SERVIDOR ============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  Servidor de Propuestas Patrimoniales  ║
║         Escuchando en puerto ${PORT}         ║
╚════════════════════════════════════════╝

📌 Acceso: http://localhost:${PORT}
🔐 Admin: admin / Admin123!
📱 Máximo agentes: 10
💾 Base de datos: ${DB_PATH}

⚠️  IMPORTANTE EN PRODUCCIÓN:
  - Cambiar SECRET_KEY en .env
  - Usar HTTPS
  - Cambiar credenciales admin
  - Configurar dominio
    `);
});

// Manejo de errores
process.on('unhandledRejection', (err) => {
    console.error('Error no manejado:', err);
});

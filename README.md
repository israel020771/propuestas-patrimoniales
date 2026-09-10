# 🔐 Generador de Propuestas Patrimoniales - Sistema Web

Sistema completo para generación automática de propuestas de seguros patrimoniales con almacenamiento en base de datos y autenticación de agentes.

## 📋 Características

✅ **Autenticación JWT** - Cada agente con su cuenta  
✅ **Base de datos SQLite** - Sin necesidad de servidor BD separado  
✅ **API REST** - Escalable y segura  
✅ **Historial completo** - Todas las propuestas guardadas  
✅ **Generación de PDFs** - Descarga automática con diseño profesional  
✅ **Multi-agente** - Soporte para hasta 10 agentes simultáneamente  
✅ **Dashboard** - Estadísticas de propuestas  

## 🚀 Instalación Local (para pruebas)

### Requisitos previos
- Node.js v14+ [descargar aquí](https://nodejs.org/)
- npm (viene con Node.js)

### Pasos de instalación

1. **Clonar o descargar los archivos**
```bash
# Si tienes git
git clone <tu-repo>
cd propuestas-patrimoniales
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Edita el archivo `.env`:
```
PORT=3000
NODE_ENV=development
DB_PATH=./propuestas.db
SECRET_KEY=tu_clave_secreta_muy_segura_CAMBIAR_EN_PRODUCCION
CORS_ORIGIN=*
API_URL=http://localhost:3000
```

4. **Iniciar el servidor**
```bash
npm start
```

La aplicación estará disponible en: **http://localhost:3000**

**Credenciales de prueba:**
- Usuario: `admin`
- Contraseña: `Admin123!`

## 📦 Deployment en Servidor (Producción)

### Opción 1: Hosting Linux con cPanel/WHM

1. **Subir archivos vía FTP o Git**
```bash
# En tu servidor
cd /home/tu_usuario/public_html
git clone <tu-repo> .
npm install --production
```

2. **Configurar Node.js en cPanel**
   - Ir a: Setup Node.js App
   - Crear nueva aplicación
   - Seleccionar carpeta del proyecto
   - Puerto: 3000 (o el que prefieras)
   - Application root: server.js
   - Copiar el dominio de proxy que te genera

3. **Crear archivo `.env` seguro**
```
PORT=3000
NODE_ENV=production
DB_PATH=/home/tu_usuario/datos/propuestas.db
SECRET_KEY=CAMBIAR_ESTO_POR_ALGO_SEGURO_ALEATORIO
CORS_ORIGIN=https://tu-dominio.com
API_URL=https://tu-dominio.com
```

4. **Iniciar la aplicación en cPanel**
   - Setup Node.js App → tuapp → Start App

### Opción 2: Hosting Linux con SSH (Recomendado)

1. **Conectar por SSH**
```bash
ssh usuario@tu-servidor.com
```

2. **Instalar Node.js (si no está instalado)**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Crear directorio del proyecto**
```bash
mkdir -p /var/www/propuestas
cd /var/www/propuestas
git clone <tu-repo> .
npm install --production
```

4. **Crear carpeta para base de datos**
```bash
mkdir -p /var/lib/propuestas
chmod 755 /var/lib/propuestas
```

5. **Usar PM2 para gestión de procesos**
```bash
sudo npm install -g pm2

# Editar .env
nano .env

# Iniciar con PM2
pm2 start server.js --name "propuestas"
pm2 startup
pm2 save
```

6. **Configurar Nginx como proxy reverso**

Crear archivo `/etc/nginx/sites-available/propuestas`:
```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;

    # Certificado SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;

    # Configuración de seguridad
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Headers de seguridad
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy a Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Compresión
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/propuestas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Configurar SSL con Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## 👥 Gestión de Agentes

### Crear nuevo agente (desde admin)

**Por API:**
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -d '{
    "username": "agente1",
    "email": "agente1@empresa.com",
    "password": "TemporalPass123!",
    "fullName": "Juan Agente"
  }'
```

**Por base de datos:**
```sql
INSERT INTO users (username, email, password, fullName, role) 
VALUES ('agente1', 'agente1@empresa.com', 'HASH_BCRYPT', 'Juan Agente', 'agent');
```

### Cambiar contraseña de agente

Los agentes pueden cambiar su contraseña o el admin puede resetearla.

## 🔒 Seguridad en Producción

**Antes de hacer público:**

1. ✅ Cambiar `SECRET_KEY` en `.env` (usar password segura de 32+ caracteres)
2. ✅ Cambiar contraseña admin por defecto
3. ✅ Usar HTTPS/SSL (Let's Encrypt es gratuito)
4. ✅ Hacer backup de `propuestas.db` regularmente
5. ✅ Configurar firewall (solo puertos 80, 443)
6. ✅ Mantener Node.js actualizado
7. ✅ Monitorear logs de error

## 📊 Backup y Restauración

### Backup automático
```bash
# Script: backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/lib/propuestas/propuestas.db /backups/propuestas_$DATE.db
tar -czf /backups/propuestas_$DATE.tar.gz /var/www/propuestas
```

### Restaurar
```bash
# Copiar archivo de backup
cp /backups/propuestas_FECHA.db /var/lib/propuestas/propuestas.db
```

## 🐛 Troubleshooting

**Error: "Port 3000 already in use"**
```bash
# Cambiar puerto en .env o liberar puerto
sudo lsof -i :3000
kill -9 PID
```

**Base de datos corrupta**
```bash
# Eliminar y recrear (perderá datos)
rm propuestas.db
npm start
```

**Token expirado en frontend**
```bash
# Token dura 24h. Los usuarios deben volver a iniciar sesión
```

## 📞 Soporte

Para problemas o mejoras, contacta al equipo de desarrollo.

## 📄 Licencia

Uso interno - No distribuir

---

**Última actualización:** 2024  
**Versión:** 1.0.0

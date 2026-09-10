#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║   Instalador - Sistema de Propuestas Patrimoniales    ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "Descárgalo desde: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js v$(node -v) detectado"
echo "✅ npm v$(npm -v) detectado"
echo ""

# Crear directorio de logs
echo "📁 Creando estructura de directorios..."
mkdir -p logs
mkdir -p data

# Instalar dependencias
echo "📦 Instalando dependencias (esto puede tomar 1-2 minutos)..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencias instaladas correctamente"
else
    echo "❌ Error instalando dependencias"
    exit 1
fi

# Crear archivo .env si no existe
if [ ! -f .env ]; then
    echo "🔧 Creando archivo .env..."
    cat > .env << 'EOF'
PORT=3000
NODE_ENV=development
DB_PATH=./propuestas.db
SECRET_KEY=tu_clave_secreta_muy_segura_cambiar_en_produccion_2024
CORS_ORIGIN=*
API_URL=http://localhost:3000
EOF
    echo "✅ Archivo .env creado"
    echo "⚠️  IMPORTANTE: Edita .env y cambia SECRET_KEY antes de producción"
else
    echo "✅ Archivo .env ya existe"
fi

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            ¡INSTALACIÓN COMPLETADA!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Para iniciar el servidor:"
echo "   npm start"
echo ""
echo "📌 Acceso:"
echo "   URL: http://localhost:3000"
echo "   Usuario: admin"
echo "   Contraseña: Admin123!"
echo ""
echo "📖 Para más información, consulta README.md"
echo ""

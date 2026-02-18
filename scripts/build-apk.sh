#!/bin/bash

# Script para gerar APK do app Double
# Uso: ./scripts/build-apk.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "🚀 Iniciando build do APK..."
echo "📁 Diretório: $PROJECT_DIR"

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    pnpm install
fi

# Verificar se EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "📥 Instalando EAS CLI..."
    npm install --global eas-cli
fi

# Verificar se app.config.ts existe
if [ ! -f "app.config.ts" ]; then
    echo "❌ Erro: app.config.ts não encontrado!"
    exit 1
fi

# Gerar código nativo
echo "🔨 Gerando código nativo..."
npx expo prebuild --clean

# Build APK
echo "⚙️  Compilando APK..."
cd android
./gradlew assembleRelease

# Encontrar o APK gerado
APK_PATH=$(find . -name "*.apk" -type f | head -1)

if [ -z "$APK_PATH" ]; then
    echo "❌ Erro: APK não foi gerado!"
    exit 1
fi

# Copiar para diretório de saída
OUTPUT_DIR="$PROJECT_DIR/build"
mkdir -p "$OUTPUT_DIR"
cp "$APK_PATH" "$OUTPUT_DIR/double-app.apk"

echo "✅ APK gerado com sucesso!"
echo "📥 Localização: $OUTPUT_DIR/double-app.apk"
echo ""
echo "Próximos passos:"
echo "1. Transfira o arquivo para seu celular"
echo "2. Abra o arquivo para instalar"
echo "3. Se solicitado, ative 'Instalar apps desconhecidos'"

#!/usr/bin/env node

/**
 * Script para gerar APK do app Double
 * Uso: node scripts/build-apk.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_DIR = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(PROJECT_DIR, 'android');
const BUILD_OUTPUT_DIR = path.join(PROJECT_DIR, 'build');

console.log('🚀 Iniciando build do APK...');
console.log(`📁 Diretório: ${PROJECT_DIR}`);

try {
  // Verificar se node_modules existe
  if (!fs.existsSync(path.join(PROJECT_DIR, 'node_modules'))) {
    console.log('📦 Instalando dependências...');
    execSync('pnpm install', { cwd: PROJECT_DIR, stdio: 'inherit' });
  }

  // Verificar se app.config.ts existe
  if (!fs.existsSync(path.join(PROJECT_DIR, 'app.config.ts'))) {
    console.error('❌ Erro: app.config.ts não encontrado!');
    process.exit(1);
  }

  // Gerar código nativo
  console.log('🔨 Gerando código nativo...');
  execSync('npx expo prebuild --clean', { cwd: PROJECT_DIR, stdio: 'inherit' });

  // Verificar se Gradle wrapper existe
  if (!fs.existsSync(path.join(ANDROID_DIR, 'gradlew'))) {
    console.error('❌ Erro: gradlew não encontrado em android/');
    process.exit(1);
  }

  // Build APK
  console.log('⚙️  Compilando APK...');
  const gradleCmd = process.platform === 'win32' 
    ? 'gradlew.bat assembleRelease' 
    : './gradlew assembleRelease';
  
  execSync(gradleCmd, { cwd: ANDROID_DIR, stdio: 'inherit' });

  // Encontrar o APK gerado
  const apkPattern = path.join(ANDROID_DIR, 'app/build/outputs/apk/release/*.apk');
  const glob = require('glob');
  
  // Alternativa simples sem glob
  const apkDir = path.join(ANDROID_DIR, 'app/build/outputs/apk/release');
  if (!fs.existsSync(apkDir)) {
    console.error('❌ Erro: Diretório de saída do APK não encontrado!');
    process.exit(1);
  }

  const apkFiles = fs.readdirSync(apkDir).filter(f => f.endsWith('.apk'));
  if (apkFiles.length === 0) {
    console.error('❌ Erro: Nenhum APK foi gerado!');
    process.exit(1);
  }

  const apkFile = apkFiles[0];
  const apkPath = path.join(apkDir, apkFile);

  // Copiar para diretório de saída
  if (!fs.existsSync(BUILD_OUTPUT_DIR)) {
    fs.mkdirSync(BUILD_OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(BUILD_OUTPUT_DIR, 'double-app.apk');
  fs.copyFileSync(apkPath, outputPath);

  console.log('✅ APK gerado com sucesso!');
  console.log(`📥 Localização: ${outputPath}`);
  console.log('');
  console.log('Próximos passos:');
  console.log('1. Transfira o arquivo para seu celular');
  console.log('2. Abra o arquivo para instalar');
  console.log('3. Se solicitado, ative "Instalar apps desconhecidos"');

} catch (error) {
  console.error('❌ Erro durante o build:', error.message);
  process.exit(1);
}

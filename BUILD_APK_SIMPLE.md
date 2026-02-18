# Build APK - App Double

## Método 1: Usar Script Automático (Recomendado)

```bash
cd /home/ubuntu/double-app
npm run build:apk
```

O script irá:
1. Instalar dependências (se necessário)
2. Gerar código nativo
3. Compilar o APK
4. Salvar em `build/double-app.apk`

## Método 2: Usar EAS Build Local

```bash
cd /home/ubuntu/double-app
npm run build:apk:eas
```

## Método 3: Compilar Manualmente

```bash
cd /home/ubuntu/double-app

# 1. Instalar dependências
pnpm install

# 2. Gerar código nativo
npx expo prebuild --clean

# 3. Compilar APK
cd android
./gradlew assembleRelease

# 4. O APK estará em:
# android/app/build/outputs/apk/release/app-release.apk
```

## Após compilar

1. Transfira o arquivo `double-app.apk` para seu celular
2. Abra o arquivo para instalar
3. Se solicitado, ative "Instalar apps desconhecidos"
4. Pronto! O app está instalado

## Troubleshooting

**"Gradle not found"**
- Instale: `sudo apt-get install gradle`

**"Build failed"**
- Limpe o cache: `rm -rf android && npx expo prebuild --clean`
- Reinstale dependências: `rm -rf node_modules && pnpm install`

**"APK muito grande"**
- Normal! Expo APKs têm ~50-100MB
- Isso inclui React Native, Expo SDK e suas dependências

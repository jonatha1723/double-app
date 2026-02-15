# Guia de Compilação - App Double

Este guia explica como compilar o app Double para Android (APK) localmente.

## Opção 1: Compilar com Expo CLI (Recomendado)

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn instalado
- Conta Expo (gratuita em https://expo.dev)

### Passos

1. **Instale o Expo CLI globalmente:**
   ```bash
   npm install -g expo-cli
   ```

2. **Navegue até a pasta do projeto:**
   ```bash
   cd /home/ubuntu/double-app
   ```

3. **Faça login na sua conta Expo:**
   ```bash
   expo login
   ```

4. **Compile para Android:**
   ```bash
   eas build --platform android
   ```

5. **Acompanhe o build:**
   - O Expo Cloud Build compilará o APK
   - Você receberá um link para baixar quando estiver pronto
   - O APK será salvo em seu computador

## Opção 2: Compilar Localmente com Android Studio

### Pré-requisitos
- Android Studio instalado
- Android SDK configurado
- Java Development Kit (JDK) instalado

### Passos

1. **Instale dependências:**
   ```bash
   cd /home/ubuntu/double-app
   npm install
   ```

2. **Gere o build Android:**
   ```bash
   expo prebuild --clean
   ```

3. **Abra no Android Studio:**
   ```bash
   open -a "Android Studio" android/
   ```

4. **Compile o APK:**
   - No Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - O APK será gerado em `android/app/build/outputs/apk/`

## Opção 3: Usar EAS CLI (Mais Simples)

### Pré-requisitos
- Conta Expo
- EAS CLI instalado

### Passos

1. **Instale EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Faça login:**
   ```bash
   eas login
   ```

3. **Configure o projeto (primeira vez):**
   ```bash
   eas build:configure
   ```

4. **Compile:**
   ```bash
   eas build --platform android --local
   ```

## Configurações Importantes

### app.config.ts
- **appName**: "Double" (nome do app)
- **appSlug**: "double-app" (identificador único)
- **iosBundleId**: "space.manus.doubleapp.t20260215050125"
- **androidPackage**: "space.manus.doubleapp.t20260215050125"

### Permissões Android
O app solicita as seguintes permissões:
- `POST_NOTIFICATIONS` - Para notificações push
- Acesso a armazenamento (implícito para downloads)
- Permissão para instalar apps de fontes desconhecidas (solicitada em tempo de execução)

## Troubleshooting

### "Namespace is not a valid Java package name"
- Já foi corrigido! O bundle ID não contém "double" como palavra-chave

### "Build failed"
- Limpe o cache: `expo prebuild --clean`
- Reinstale dependências: `rm -rf node_modules && npm install`

### "APK não instala"
- Verifique se o Android 7+ está instalado
- Ative "Instalar apps desconhecidos" nas configurações

## Próximos Passos

Após compilar o APK:

1. **Teste no seu dispositivo:**
   - Transfira o APK para o celular
   - Toque no arquivo para instalar
   - Ative "Instalar apps desconhecidos" se solicitado

2. **Teste as funcionalidades:**
   - WebView carrega o site corretamente
   - Botão de configurações aparece no canto inferior direito
   - Diálogo de permissão aparece ao tentar instalar APK

3. **Publique na Play Store:**
   - Crie uma conta de desenvolvedor Google Play
   - Siga o guia de publicação do Expo

## Suporte

Para mais informações:
- Documentação Expo: https://docs.expo.dev
- Documentação EAS Build: https://docs.expo.dev/build/introduction/
- Comunidade Expo: https://forums.expo.dev

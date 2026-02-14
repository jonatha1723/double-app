# Double — Design Document

## Visão Geral

O Double é um app híbrido WebView + nativo, projetado para fornecer uma experiência de app completa. Carrega conteúdo de sites dinâmicos, suporta login seguro via Firebase, armazenamento, downloads, atualizações automáticas e manipulação de arquivos no celular.

## Telas do App

### 1. Tela de Login (LoginScreen)
- **Conteúdo**: Logo do app "Double", campo de email, campo de senha, botão "Entrar", botão "Entrar com Google", link "Criar conta"
- **Funcionalidade**: Autenticação via Firebase Auth (email/senha e Google Sign-In). Login obrigatório antes de acessar o WebView.
- **Layout**: Centralizado verticalmente, logo no topo, formulário no centro, botões de ação abaixo.

### 2. Tela de Cadastro (RegisterScreen)
- **Conteúdo**: Logo, campos de nome, email, senha, confirmar senha, botão "Criar Conta", link "Já tenho conta"
- **Funcionalidade**: Registro de novo usuário via Firebase Auth email/senha.
- **Layout**: Similar à tela de login.

### 3. Tela Principal — WebView (HomeScreen / WebViewScreen)
- **Conteúdo**: WebView em tela cheia carregando `https://doubleds.vercel.app/`
- **Funcionalidade**: 
  - Carrega site principal; se falhar, fallback para `https://filme-indol-one.vercel.app/`
  - JS ↔ Native bridge para comunicação bidirecional
  - Suporte completo a JavaScript
  - Intercepta downloads de arquivos
- **Layout**: WebView ocupa toda a tela, com barra de status nativa no topo.

### 4. Tela de Atualização (UpdateScreen)
- **Conteúdo**: Estilo chat com mensagem do site sobre nova versão, barra de progresso de download, botão "Baixar Atualização"
- **Funcionalidade**: 
  - Exibe mensagem personalizada do site
  - Download do APK com barra de progresso
  - Solicita instalação do APK após download
- **Layout**: Estilo chat/mensagem, bolha de mensagem com informações da atualização, botão de ação no rodapé.

### 5. Tela de Downloads (DownloadsScreen)
- **Conteúdo**: Lista de arquivos baixados (imagens, PDFs, vídeos, apps), com ícone do tipo, nome, tamanho, data
- **Funcionalidade**: 
  - Visualizar arquivos baixados
  - Abrir/compartilhar arquivos
  - Upload para Firebase Storage
  - Excluir arquivos locais
- **Layout**: Lista vertical com cards de arquivo, cada card com ícone, nome, tamanho e ações.

### 6. Tela de Gerenciamento de Arquivos (FilesScreen)
- **Conteúdo**: Navegador de arquivos do dispositivo, com breadcrumb de navegação
- **Funcionalidade**: 
  - Navegar pelo sistema de arquivos local
  - Modificar, renomear, excluir arquivos
  - Upload de arquivos para Firebase Storage
  - Permissões nativas solicitadas dinamicamente
- **Layout**: Lista de arquivos/pastas com ícones, breadcrumb no topo.

## Fluxos de Usuário Principais

### Fluxo de Login
1. Abrir app → Tela de Login
2. Inserir email/senha ou tocar "Entrar com Google"
3. Após autenticação → Navegar para WebView principal

### Fluxo de WebView com Fallback
1. Após login → Tentar carregar `https://doubleds.vercel.app/`
2. Se falhar → Automaticamente carregar `https://filme-indol-one.vercel.app/`
3. Site carregado com suporte completo a JS bridge

### Fluxo de Atualização Automática
1. App verifica versão ao iniciar (JSON endpoint)
2. Site pode enviar notificação via JS bridge em tempo real
3. Se nova versão → Exibir tela estilo chat com mensagem
4. Usuário toca "Baixar" → Download com barra de progresso
5. Após download → Solicitar instalação do APK

### Fluxo de Download de Arquivos
1. Usuário clica em link de download no WebView
2. App intercepta e inicia download
3. Arquivo salvo localmente
4. Opção de upload para Firebase Storage
5. Arquivo aparece na tela de Downloads

## Paleta de Cores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| primary | #6C5CE7 | #A29BFE | Cor principal do app, botões, destaques |
| background | #FFFFFF | #0F0F23 | Fundo das telas |
| surface | #F8F9FA | #1A1A2E | Cards, superfícies elevadas |
| foreground | #2D3436 | #DFE6E9 | Texto principal |
| muted | #636E72 | #B2BEC3 | Texto secundário |
| border | #DFE6E9 | #2D3436 | Bordas e divisores |
| success | #00B894 | #55EFC4 | Estados de sucesso |
| warning | #FDCB6E | #FFEAA7 | Avisos |
| error | #D63031 | #FF7675 | Erros |
| accent | #00CEC9 | #81ECEC | Cor secundária, links |

## Estrutura de Navegação

- **Auth Stack** (não autenticado):
  - LoginScreen
  - RegisterScreen
- **Main Stack** (autenticado):
  - Tab Navigator:
    - Home (WebView)
    - Downloads
    - Arquivos
  - Modal:
    - UpdateScreen (exibido quando há atualização disponível)

## Considerações de Design

- **Orientação**: Retrato (portrait) apenas
- **Uso com uma mão**: Botões de ação na parte inferior da tela
- **iOS HIG**: Seguir padrões de design iOS para navegação, tipografia e espaçamento
- **Feedback tátil**: Haptics em ações principais (download, login, navegação)
- **Modo escuro**: Suporte completo com tokens de cor automáticos

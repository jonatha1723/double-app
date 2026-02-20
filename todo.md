# Project TODO

## Implementado
- [x] Configurar tema e cores do app (paleta Double)
- [x] Gerar logo personalizada do app
- [x] Configurar branding no app.config.ts
- [x] Remover tela de login - ir direto para WebView
- [x] Remover abas completamente - apenas WebView tela cheia
- [x] WebView principal carregando site primário (tela cheia)
- [x] Fallback automático para site alternativo
- [x] JS ↔ Native bridge (comunicação bidirecional)
- [x] Sistema de atualizações automáticas (JSON endpoint)
- [x] Notificação de atualização via JS bridge
- [x] Botão flutuante persistente de atualização
- [x] Atualização persiste mesmo fechando o app (AsyncStorage)
- [x] Sistema de download de APK com permissão de fontes desconhecidas
- [x] Download de APK com barra de progresso
- [x] Instalação de APK no Android
- [x] Tratamento robusto de erros
- [x] Suporte a permissões de instalação de fontes desconhecidas
- [x] Corrigir bundle ID para evitar palavras-chave Java

## Opcional (Futuro)
- [ ] Testes em dispositivo real
- [ ] Adicionar Google Sign-In
- [ ] Cache inteligente para uso offline

## Android Bridge (Nova Funcionalidade)
- [x] Criar Android Bridge com funções de controle
- [x] Implementar requestDownload (verifica arquivo, baixa se não existe)
- [x] Implementar requestInstall (abre instalador para APK baixado)
- [x] Implementar checkStatus (verifica status do APK)
- [x] Implementar deleteFile (deleta arquivo APK)
- [x] Implementar openInstaller (abre instalador direto)
- [x] Implementar requestPermission (solicita permissão de fontes desconhecidas)
- [x] Integrar Android Bridge no WebView
- [x] Adicionar injeção de JavaScript para expor bridge ao site
- [x] Adicionar callbacks para site (onDownloadComplete, onStatusCheck, etc)
- [x] Adicionar diálogo visual de permissão para instalar apps desconhecidos
- [x] Redirecionar para configurações do Android se permissão não concedida

## Interface de Permissões (Nova Funcionalidade)
- [x] Remover botão flutuante de configurações
- [x] Remover tela de configurações/menu do app
- [x] Manter apenas diálogo de permissão automático

## Build e Deploy
- [x] Remover botão flutuante de configurações
- [x] Projeto pronto para compilação local
- [x] Documentação de compilação preparada

## Melhorias Finais
- [x] Remover botão flutuante de atualização
- [x] Criar nova notificação visual para instalação de APK
- [x] Melhorar UX do diálogo de permissão
- [x] Testar sem erros

## Bug Fix - FileUriExposedException
- [x] Corrigir FileUriExposedException ao instalar APK
- [x] Implementar flags corretos para Intent (FLAG_GRANT_READ_URI_PERMISSION)
- [x] Normalizar URIs de arquivo
- [x] Adicionar logging para debug

## Tela Cheia Completa
- [x] Esconder barra de navegação do Android em modo tela cheia
- [x] Implementar requestFullscreen no Android Bridge
- [x] Permitir que site controle via JavaScript
- [x] Adicionar listener de eventos para fullscreen

## Bug Fix - Crash de Início
- [x] Identificar causa do crash (duplicação de UnknownSourcesDialog)
- [x] Remover UnknownSourcesDialog do root layout
- [x] Remover código morto de dialogRef
- [x] Sem erros TypeScript

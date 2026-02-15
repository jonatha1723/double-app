/**
 * JavaScript Injection para WebView
 * Expõe o Android Bridge ao site para controle de downloads e instalações
 */

export const ANDROID_BRIDGE_INJECTION = `
(function() {
  // Android Bridge - Interface para comunicação site ↔ app
  window.Android = {
    // Solicitar download de APK
    // Verifica se arquivo existe, se não → baixa
    // Se existir → ignora download
    requestDownload: function(apkId, url) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'androidBridge',
          method: 'requestDownload',
          apkId: apkId,
          url: url
        }));
      }
    },

    // Solicitar instalação de APK
    // Abre o instalador para o APK já baixado
    requestInstall: function(apkId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'androidBridge',
          method: 'requestInstall',
          apkId: apkId
        }));
      }
    },

    // Verificar status do APK
    // Retorna: pending, downloading, downloaded, installing, installed, error
    checkStatus: function(apkId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'androidBridge',
          method: 'checkStatus',
          apkId: apkId
        }));
      }
    },

    // Deletar arquivo APK
    // Remove o arquivo do armazenamento
    deleteFile: function(apkId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'androidBridge',
          method: 'deleteFile',
          apkId: apkId
        }));
      }
    },

    // Abrir instalador diretamente
    // Se arquivo existe → abre instalador
    // Se não existe → erro
    openInstaller: function(apkId) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'androidBridge',
          method: 'openInstaller',
          apkId: apkId
        }));
      }
    },

    // Solicitar permissão de fontes desconhecidas
    // Abre as configurações do Android para ativar
    requestPermission: function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'androidBridge',
          method: 'requestPermission'
        }));
      }
    }
  };

  // Alias para compatibilidade
  window.AndroidApp = window.Android;

  true;
})();
`;

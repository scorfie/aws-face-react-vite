export interface WebViewMessage {
  sessionId: string | undefined | null;
  data?: any;
}

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        livenessObserver?: {
          postMessage: (message: any) => void;
        };
      };
    };
    AndroidLivenessObserver?: {
      postMessage: (message: string) => void;
    };
  }
}

export const postMessageToWebView = (message: WebViewMessage): void => {
  // For iOS (WKScriptMessageHandler)
  if (
    window.webkit &&
    window.webkit.messageHandlers &&
    window.webkit.messageHandlers.livenessObserver
  ) {
    window.webkit.messageHandlers.livenessObserver.postMessage(message);
    return;
  }

  // For Android (JavascriptInterface)
  if (
    window.AndroidLivenessObserver &&
    typeof window.AndroidLivenessObserver.postMessage === "function"
  ) {
    window.AndroidLivenessObserver.postMessage(JSON.stringify(message));
    return;
  }

  // Fallback log for web debugging
  console.log(
    "No native WebView bridge detected. Message to native would be:",
    message,
  );
};

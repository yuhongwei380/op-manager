import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OpenWrtNode } from '../types';

export default function OpenClashConfigScreen({ route }: any) {
    const { node } = route.params as { node: OpenWrtNode };
    const webViewRef = useRef<any>(null);

    // Auto-login injection script:
    // On every page load, check if the LuCI login form is present.
    // If it is, fill in the saved credentials and submit the form automatically.
    const autoLoginScript = `
        (function() {
            function tryAutoLogin() {
                var userField = document.querySelector('input[name="luci_username"]');
                var passField = document.querySelector('input[name="luci_password"]');
                if (userField && passField) {
                    userField.value = ${JSON.stringify(node.username || 'root')};
                    passField.value = ${JSON.stringify(node.password || '')};
                    var form = userField.closest('form');
                    if (form) {
                        form.submit();
                    }
                }
            }
            // Try immediately after page loads
            tryAutoLogin();
            // Also watch for dynamic DOM changes (some LuCI themes render asynchronously)
            var observer = new MutationObserver(function() {
                tryAutoLogin();
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
            // Safety net: retries for 3 seconds
            var tries = 0;
            var timer = setInterval(function() {
                tryAutoLogin();
                tries++;
                if (tries > 6) clearInterval(timer);
            }, 500);
        })();
        true; // Required for Android WebView
    `;

    const configUrl = `${node.protocol}://${node.host}:${node.port}/cgi-bin/luci/admin/services/openclash`;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ uri: configUrl }}
                style={styles.webview}
                startInLoadingState={true}
                mixedContentMode="always"
                javaScriptEnabled={true}
                domStorageEnabled={true}
                injectedJavaScript={autoLoginScript}
                onMessage={() => { }} // required for injectedJavaScript on some versions
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    webview: {
        flex: 1,
    },
});

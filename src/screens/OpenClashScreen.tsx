import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OpenWrtNode } from '../types';

export default function OpenClashScreen({ route }: any) {
    const { node } = route.params as { node: OpenWrtNode };

    const apiBaseUrl = `${node.protocol}://${node.host}:9090`;

    // Injected BEFORE page content loads so Yacd reads the correct backend from localStorage
    // Yacd stores its config under the key 'yacd-setting' in localStorage
    // We forcefully overwrite it with the correct router IP before Yacd initialises
    const preloadScript = `
        (function() {
            try {
                var setting = {
                    clashAPIURL: ${JSON.stringify(apiBaseUrl)},
                    clashAPISecret: '',
                    selectedChartStyle: 0,
                    latencyTestURL: 'http://www.gstatic.com/generate_204',
                    autoCloseOldConns: false,
                    useFakeIPDB: false,
                    logLevel: 'info',
                    theme: 'dark'
                };
                localStorage.setItem('yacd-setting', JSON.stringify(setting));
            } catch(e) {}
        })();
        true;
    `;

    // Also run after load for LuCI auto-login fallback
    const postLoadScript = `
        (function() {
            function tryAutoLogin() {
                var userField = document.querySelector('input[name="luci_username"]');
                var passField = document.querySelector('input[name="luci_password"]');
                if (userField && passField) {
                    userField.value = ${JSON.stringify(node.username || 'root')};
                    passField.value = ${JSON.stringify(node.password || '')};
                    var form = userField.closest('form');
                    if (form) form.submit();
                }
            }
            tryAutoLogin();
            var tries = 0;
            var timer = setInterval(function() {
                tryAutoLogin();
                tries++;
                if (tries > 6) clearInterval(timer);
            }, 500);
        })();
        true;
    `;

    const dashboardUrl = `${node.protocol}://${node.host}:9090/ui/yacd/`;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: dashboardUrl }}
                style={styles.webview}
                startInLoadingState={true}
                mixedContentMode="always"
                javaScriptEnabled={true}
                domStorageEnabled={true}
                injectedJavaScriptBeforeContentLoaded={preloadScript}
                injectedJavaScript={postLoadScript}
                onMessage={() => { }}
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
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
    },
});

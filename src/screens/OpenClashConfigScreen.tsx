import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OpenWrtNode } from '../types';

export default function OpenClashConfigScreen({ route }: any) {
    const { node } = route.params as { node: OpenWrtNode };
    const webViewRef = useRef<any>(null);

    // Auto-login injection script:
    // On every page load, check if the LuCI login form is present.
    // Fills credentials and CLICKS the submit button (not form.submit()) so that
    // any LuCI CSRF token / JS validation attached to the button is preserved.
    // Observer and timer are both stopped as soon as the first successful click fires.
    const autoLoginScript = `
        (function() {
            var done = false;

            function tryAutoLogin() {
                if (done) return;

                var userField = document.querySelector('input[name="luci_username"]');
                var passField = document.querySelector('input[name="luci_password"]');
                if (!userField || !passField) return;

                // Fill credentials
                userField.value = ${JSON.stringify(node.username || 'root')};
                passField.value = ${JSON.stringify(node.password || '')};

                // Trigger input/change events so any JS validation notices the values
                ['input', 'change'].forEach(function(evtName) {
                    userField.dispatchEvent(new Event(evtName, { bubbles: true }));
                    passField.dispatchEvent(new Event(evtName, { bubbles: true }));
                });

                var form = userField.closest('form');
                if (!form) return;

                // Prefer clicking the submit button over form.submit() so that
                // LuCI's CSRF token and any onclick handlers are preserved.
                var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (!submitBtn) {
                    // Argon / some themes use a generic button without type="submit"
                    var allBtns = form.querySelectorAll('button');
                    for (var i = 0; i < allBtns.length; i++) {
                        var txt = (allBtns[i].textContent || '').trim().toLowerCase();
                        if (txt === 'login' || txt === '登录' || txt === '登入' || txt === 'sign in') {
                            submitBtn = allBtns[i];
                            break;
                        }
                    }
                }

                done = true;         // mark before click to avoid re-entry
                clearInterval(timer);
                if (observer) observer.disconnect();

                if (submitBtn) {
                    submitBtn.click();
                } else {
                    // Last resort: plain form submit
                    form.submit();
                }
            }

            // Try immediately
            tryAutoLogin();

            // Watch for dynamic DOM changes (Argon / Bootstrap LuCI render async)
            var observer;
            try {
                observer = new MutationObserver(function() { tryAutoLogin(); });
                observer.observe(document.documentElement, { childList: true, subtree: true });
            } catch(e) {}

            // Safety net: retry every 500 ms for up to 10 s
            var tries = 0;
            var timer = setInterval(function() {
                if (done) { clearInterval(timer); return; }
                tryAutoLogin();
                tries++;
                if (tries > 20) clearInterval(timer);
            }, 500);
        })();
        true;
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

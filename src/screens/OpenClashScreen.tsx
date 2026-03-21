import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OpenWrtNode } from '../types';

export default function OpenClashScreen({ route }: any) {
    const { node } = route.params as { node: OpenWrtNode };

    const apiBaseUrl = `${node.protocol}://${node.host}:9090`;

    // Injected BEFORE page content loads.
    // Write all known localStorage key variants so zashboard / metacubexd
    // will pick up the correct backend URL on first render.
    const preloadScript = `
        (function() {
            try {
                var url = ${JSON.stringify(apiBaseUrl)};
                // zashboard / metacubexd store backend URLs in this key
                var backends = [url];
                localStorage.setItem('backendList', JSON.stringify(backends));
                localStorage.setItem('selectedBackend', url);
                // metacubexd also reads these keys
                localStorage.setItem('selectedClashAPIURL', url);
                localStorage.setItem('clashAPIConfig', JSON.stringify({ clashAPIURL: url, clashAPISecret: '' }));
                // yacd legacy keys (kept for compatibility)
                var setting = {
                    clashAPIURL: url,
                    clashAPISecret: '',
                    selectedChartStyle: 0,
                    latencyTestURL: 'http://www.gstatic.com/generate_204',
                    autoCloseOldConns: false,
                    useFakeIPDB: false,
                    logLevel: 'info',
                    theme: 'dark'
                };
                localStorage.setItem('yacd-setting', JSON.stringify(setting));
                localStorage.setItem('clashAPIURL', url);
            } catch(e) {}
        })();
        true;
    `;

    // Runs after the page finishes loading.
    // 1. Tries LuCI auto-login if the router's LuCI login page is shown.
    // 2. Polls for yacd's "API Base URL" input box and fills it in by firing
    //    React's synthetic change event so the controlled component accepts the value,
    //    then submits the form so yacd connects immediately.
    const postLoadScript = `
        (function() {
            var TARGET_URL = ${JSON.stringify(apiBaseUrl)};

            // --- LuCI auto-login ---
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
            var loginTries = 0;
            var loginTimer = setInterval(function() {
                tryAutoLogin();
                loginTries++;
                if (loginTries > 6) clearInterval(loginTimer);
            }, 500);

            // --- yacd API Base URL auto-fill ---
            // Helper: set value on a React-controlled input via the native setter
            function setReactInputValue(el, value) {
                var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
                if (nativeSetter && nativeSetter.set) {
                    nativeSetter.set.call(el, value);
                } else {
                    el.value = value;
                }
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }

            var fillTries = 0;
            var fillTimer = setInterval(function() {
                fillTries++;
                if (fillTries > 40) { clearInterval(fillTimer); return; } // give up after ~20s

                // Find an input that looks like the API Base URL field.
                // yacd renders it as a text input whose current value is a URL or empty.
                var inputs = document.querySelectorAll('input[type="text"], input[type="url"], input:not([type])');
                for (var i = 0; i < inputs.length; i++) {
                    var inp = inputs[i];
                    var placeholder = (inp.placeholder || '').toLowerCase();
                    var label = '';
                    // Try to resolve associated label text
                    if (inp.id) {
                        var lbl = document.querySelector('label[for="' + inp.id + '"]');
                        if (lbl) label = lbl.textContent.toLowerCase();
                    }
                    if (!label && inp.closest('label')) {
                        label = inp.closest('label').textContent.toLowerCase();
                    }
                    var isApiField = placeholder.indexOf('http') !== -1
                        || label.indexOf('api') !== -1
                        || label.indexOf('base url') !== -1
                        || label.indexOf('backend') !== -1
                        || placeholder.indexOf('clash') !== -1;

                    if (isApiField && inp.value !== TARGET_URL) {
                        setReactInputValue(inp, TARGET_URL);
                        // Try to submit the form / click the Save button
                        setTimeout(function() {
                            var btn = document.querySelector('button[type="submit"]');
                            if (!btn) {
                                // yacd uses a button that says "Add" or "Save"
                                var allBtns = document.querySelectorAll('button');
                                for (var b = 0; b < allBtns.length; b++) {
                                    var txt = allBtns[b].textContent.toLowerCase();
                                    if (txt.indexOf('add') !== -1 || txt.indexOf('save') !== -1 || txt.indexOf('ok') !== -1) {
                                        btn = allBtns[b];
                                        break;
                                    }
                                }
                            }
                            if (btn) btn.click();
                        }, 300);
                        clearInterval(fillTimer);
                        return;
                    }
                }
            }, 500);
        })();
        true;
    `;

    const dashboardUrl = `${node.protocol}://${node.host}:9090/ui/zashboard/#/proxies`;

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

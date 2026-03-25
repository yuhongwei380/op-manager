import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { OpenWrtNode } from '../types';

export default function OpenClashScreen({ route }: any) {
    const { node } = route.params as { node: OpenWrtNode };

    // Auto-login LuCI if the router redirects there, then find the zashboard
    // "主机" (host) input and fill it with node.host (the real IP from System
    // Information), followed by clicking 提交 so the backend is saved.
    //
    // We do NOT pre-write to localStorage — that would cause a duplicate entry
    // (one from localStorage, one from the form submission). Once the user
    // submits the form, zashboard saves the backend itself; on subsequent
    // visits the form won't appear and they'll land directly on /proxies.
    const autoFillScript = `
        (function() {
            var TARGET_HOST     = ${JSON.stringify(node.host)};
            var TARGET_PROTOCOL = ${JSON.stringify(node.protocol)};

            // ── LuCI auto-login ──────────────────────────────────────────────
            function tryAutoLogin() {
                var u = document.querySelector('input[name="luci_username"]');
                var p = document.querySelector('input[name="luci_password"]');
                if (u && p) {
                    u.value = ${JSON.stringify(node.username || 'root')};
                    p.value = ${JSON.stringify(node.password || '')};
                    var f = u.closest('form');
                    if (f) f.submit();
                }
            }
            tryAutoLogin();
            var loginTries = 0;
            var loginTimer = setInterval(function() {
                tryAutoLogin();
                if (++loginTries > 8) clearInterval(loginTimer);
            }, 500);

            // ── Zashboard host-field auto-fill ───────────────────────────────
            // Uses Vue's native input setter so the reactive model updates.
            function setVueValue(el, value) {
                var proto = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                );
                if (proto && proto.set) proto.set.call(el, value);
                else el.value = value;
                el.dispatchEvent(new Event('input',  { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Find the host input: zashboard's first text input in the backend
            // form. Its placeholder or current value is '127.0.0.1'.
            function findHostInput() {
                var inputs = document.querySelectorAll(
                    'input[type="text"], input:not([type])'
                );
                for (var i = 0; i < inputs.length; i++) {
                    var v = (inputs[i].value || '').trim();
                    var ph = (inputs[i].placeholder || '').trim();
                    if (v === '127.0.0.1' || v === 'localhost' ||
                        ph === '127.0.0.1' || ph.toLowerCase() === 'host') {
                        return inputs[i];
                    }
                }
                return null;
            }

            // Click the 提交 / Submit button.
            function clickSubmit() {
                var btns = document.querySelectorAll('button');
                for (var i = 0; i < btns.length; i++) {
                    var t = (btns[i].textContent || '').trim();
                    if (t === '\\u63d0\\u4ea4' || t.toLowerCase() === 'submit') {
                        btns[i].click();
                        return true;
                    }
                }
                return false;
            }

            var done   = false;
            var tries  = 0;
            var timer  = setInterval(function() {
                if (done || ++tries > 30) { clearInterval(timer); return; }

                var hostInput = findHostInput();
                if (!hostInput) return;   // form not rendered yet — keep waiting

                // Fill host with the real router IP.
                setVueValue(hostInput, TARGET_HOST);
                done = true;
                clearInterval(timer);

                // Give Vue 600 ms to process the reactive update, then submit.
                setTimeout(function() {
                    clickSubmit();
                }, 600);
            }, 300);
        })();
        true;
    `;

    const dashboardUrl =
        `${node.protocol}://${node.host}:9090/ui/zashboard/#/proxies`;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: dashboardUrl }}
                style={styles.webview}
                startInLoadingState={true}
                mixedContentMode="always"
                javaScriptEnabled={true}
                domStorageEnabled={true}
                injectedJavaScript={autoFillScript}
                onMessage={() => { }}
                onError={(syntheticEvent: any) => {
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

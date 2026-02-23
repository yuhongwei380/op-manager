import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { OpenWrtNode } from '../types';

export default function OpenClashScreen({ route }: any) {
    const { node } = route.params as { node: OpenWrtNode };

    // Generate the OpenClash Dashboard URL (using Yacd)
    // We pass the hostname and port as query parameters so Yacd automatically connects
    const dashboardUrl = `${node.protocol}://${node.host}:9090/ui/yacd/?hostname=${node.host}&port=9090`;

    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: dashboardUrl }}
                style={styles.webview}
                startInLoadingState={true}
                mixedContentMode="always"
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

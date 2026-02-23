import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { saveNode } from '../storage';
import { OpenWrtNode } from '../types';

export default function AddNodeScreen({ route, navigation }: any) {
    const existingNode = route.params?.existingNode as OpenWrtNode | undefined;

    const [host, setHost] = useState(existingNode?.host || '');
    const [port, setPort] = useState(existingNode?.port || '80');
    const [isHttps, setIsHttps] = useState(existingNode?.protocol === 'https');
    const [username, setUsername] = useState(existingNode?.username || 'root');
    const [password, setPassword] = useState(existingNode?.password || '');
    const [remarks, setRemarks] = useState(existingNode?.remarks || '');

    const handleSave = async () => {
        if (!host) {
            alert('Host address is required');
            return;
        }

        const newNode: OpenWrtNode = {
            id: existingNode?.id || Date.now().toString(),
            host,
            port,
            protocol: isHttps ? 'https' : 'http',
            username,
            password,
            remarks,
        };

        await saveNode(newNode);
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Remarks (Name)</Text>
                <TextInput
                    style={styles.input}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder="e.g. Home Router"
                    placeholderTextColor="#9CA3AF"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Host Address</Text>
                <TextInput
                    style={styles.input}
                    value={host}
                    onChangeText={setHost}
                    placeholder="192.168.1.1 or example.com"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="url"
                />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Port</Text>
                    <TextInput
                        style={styles.input}
                        value={port}
                        onChangeText={setPort}
                        placeholder="80 or 443"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="number-pad"
                    />
                </View>

                <View style={[styles.formGroup, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={styles.label}>Use HTTPS</Text>
                    <Switch
                        value={isHttps}
                        onValueChange={setIsHttps}
                        trackColor={{ false: '#D1D5DB', true: '#60A5FA' }}
                        thumbColor={isHttps ? '#3B82F6' : '#F9FAFB'}
                        style={{ marginTop: 10 }}
                    />
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="root"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Leave blank if no password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Node</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#111827',
    },
    saveBtn: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    saveBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

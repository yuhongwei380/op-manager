import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { authenticate, fetchSystemStats } from '../api';
import { OpenWrtNode, NodeStats } from '../types';

export default function NodeDashboardScreen({ route, navigation }: any) {
    const { node } = route.params as { node: OpenWrtNode };
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<NodeStats | null>(null);

    useEffect(() => {
        navigation.setOptions({ title: node.remarks || node.host });
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        try {
            const token = await authenticate(node);
            const data = await fetchSystemStats(node, token);
            setStats(data);
        } catch (e: any) {
            // Silently fail - dashboard still shows node info and OpenClash entry even without stats
            console.warn('Stats load skipped (router API unavailable):', e?.message);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };


    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Fetching router metrics...</Text>
            </View>
        );
    }


    return (
        <ScrollView style={styles.container}>
            {/* Node Info Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>System Information</Text>
                <Text style={styles.infoRow}>Address: {node.host}:{node.port}</Text>
                <Text style={styles.infoRow}>Protocol: {node.protocol.toUpperCase()}</Text>
                <Text style={styles.infoRow}>User: {node.username}</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>CPU Usage</Text>
                    <Text style={styles.statValue}>{stats ? `${stats.cpu}%` : 'N/A'}</Text>
                </View>

                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Memory Free</Text>
                    <Text style={styles.statValue}>
                        {stats?.memory ? formatBytes(stats.memory.available) : 'N/A'}
                    </Text>
                </View>

                <View style={[styles.statBox, { width: '100%', marginTop: 16 }]}>
                    <Text style={styles.statLabel}>System Load (1m, 5m, 15m)</Text>
                    <Text style={styles.statValue}>
                        {stats ? `${stats.load[0]} / ${stats.load[1]} / ${stats.load[2]}` : 'N/A'}
                    </Text>
                </View>
            </View>

            {!stats && (
                <Text style={styles.apiHint}>
                    ⚠️ Router statistics unavailable. The ubus/LuCI API may require additional packages or credentials.
                </Text>
            )}

            {/* Services Section */}
            <Text style={styles.sectionTitle}>Services</Text>

            <TouchableOpacity
                style={styles.serviceItem}
                onPress={() => navigation.navigate('OpenClash', { node })}
            >
                <View>
                    <Text style={styles.serviceName}>OpenClash Dashboard</Text>
                    <Text style={styles.serviceDesc}>Manage proxies, rules & nodes via Yacd</Text>
                </View>
                <Text style={styles.arrowIcon}>→</Text>
            </TouchableOpacity>

            {/* We can add more services here easily later */}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
    errorText: { color: '#EF4444', fontSize: 16, marginBottom: 16, textAlign: 'center', paddingHorizontal: 20 },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#3B82F6', borderRadius: 8 },
    retryText: { color: '#FFF', fontWeight: '600' },

    card: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1F2937' },
    infoRow: { fontSize: 14, color: '#4B5563', marginBottom: 4 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 },
    statBox: { width: '48%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
    statValue: { fontSize: 24, fontWeight: '800', color: '#3B82F6' },

    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 12, marginLeft: 4 },
    serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    serviceName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    serviceDesc: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    arrowIcon: { fontSize: 24, color: '#9CA3AF' },
    apiHint: { fontSize: 13, color: '#F59E0B', backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginBottom: 20, lineHeight: 20 },
});

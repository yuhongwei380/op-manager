import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getNodes, deleteNode } from '../storage';
import { OpenWrtNode } from '../types';

export default function HomeScreen({ navigation }: any) {
    const [nodes, setNodes] = useState<OpenWrtNode[]>([]);

    const loadNodes = async () => {
        const fetched = await getNodes();
        setNodes(fetched);
    };

    useFocusEffect(
        useCallback(() => {
            loadNodes();
        }, [])
    );

    const handleDelete = (id: string, name: string) => {
        Alert.alert('Delete Node', `Are you sure you want to delete ${name}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteNode(id);
                    loadNodes();
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: OpenWrtNode }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('NodeDashboard', { node: item })}
            onLongPress={() => navigation.navigate('AddNode', { existingNode: item })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.remarks || item.host}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.remarks || item.host)}>
                    <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.cardText}>Address: {item.protocol}://{item.host}:{item.port}</Text>
            <Text style={styles.cardText}>User: {item.username}</Text>
            <Text style={styles.instructionText}>Tap to access Dashboard • Long press to Edit</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.headerTitle}>My OpenWrt Nodes</Text>
            <FlatList
                data={nodes}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No nodes added yet.</Text>
                        <Text style={styles.emptySubText}>Tap the + button to add a new router connection.</Text>
                    </View>
                }
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddNode')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F2937',
    },
    deleteBtn: {
        color: '#EF4444',
        fontWeight: '600',
    },
    cardText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 4,
    },
    instructionText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 10,
        fontStyle: 'italic',
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    fabIcon: {
        fontSize: 32,
        color: '#FFF',
        lineHeight: 34,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#6B7280',
        fontWeight: '500',
    },
    emptySubText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

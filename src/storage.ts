import AsyncStorage from '@react-native-async-storage/async-storage';
import { OpenWrtNode } from './types';

const NODES_STORAGE_KEY = '@openwrt_nodes';

export const getNodes = async (): Promise<OpenWrtNode[]> => {
    try {
        const jsonValue = await AsyncStorage.getItem(NODES_STORAGE_KEY);
        return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
        console.error('Failed to fetch nodes from storage:', e);
        return [];
    }
};

export const saveNode = async (node: OpenWrtNode): Promise<void> => {
    try {
        const nodes = await getNodes();
        const existingIndex = nodes.findIndex((n) => n.id === node.id);
        if (existingIndex >= 0) {
            nodes[existingIndex] = node;
        } else {
            nodes.push(node);
        }
        await AsyncStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    } catch (e) {
        console.error('Failed to save node to storage:', e);
    }
};

export const deleteNode = async (id: string): Promise<void> => {
    try {
        const nodes = await getNodes();
        const filteredNodes = nodes.filter((n) => n.id !== id);
        await AsyncStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(filteredNodes));
    } catch (e) {
        console.error('Failed to delete node from storage:', e);
    }
};

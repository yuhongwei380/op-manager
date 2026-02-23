import axios from 'axios';
import { OpenWrtNode, NodeStats } from './types';

// Perform LuCI RPC Auth to retrieve an authentication token
export const authenticate = async (node: OpenWrtNode): Promise<string> => {
    const url = `${node.protocol}://${node.host}:${node.port}/cgi-bin/luci/rpc/auth`;
    try {
        const response = await axios.post(url, {
            id: 1,
            method: "login",
            params: [node.username, node.password || ""]
        });
        if (response.data && response.data.result) {
            return response.data.result;
        }
        throw new Error('Authentication failed');
    } catch (error) {
        console.error('Auth error for node:', node.host, error);
        throw error;
    }
};

// Fetch system stats using UBUS standard json-rpc
export const fetchSystemStats = async (node: OpenWrtNode, token: string): Promise<NodeStats> => {
    const url = `${node.protocol}://${node.host}:${node.port}/ubus`;

    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "call",
        params: [token, "system", "info", {}]
    };

    try {
        const response = await axios.post(url, payload);
        const data = response.data.result?.[1] || {};
        // Extract info - mapping ubus system info format to our NodeStats type
        return {
            cpu: 0, // Would need more specific ubus call or calc for actual CPU%
            memory: {
                total: data.memory?.total || 0,
                available: data.memory?.free || 0,
            },
            load: data.load || [0, 0, 0]
        };
    } catch (error) {
        console.error('Fetch stats error:', error);
        throw error;
    }
};

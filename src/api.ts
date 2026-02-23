import axios from 'axios';
import { OpenWrtNode, NodeStats } from './types';

// Perform LuCI RPC Auth to retrieve an authentication token
export const authenticate = async (node: OpenWrtNode): Promise<string> => {
    // 1. Try ubus auth first (Modern OpenWrt >= 21.02)
    const ubusUrl = `${node.protocol}://${node.host}:${node.port}/ubus`;
    try {
        const ubusRes = await axios.post(ubusUrl, {
            jsonrpc: "2.0",
            id: 1,
            method: "call",
            params: [
                "00000000000000000000000000000000",
                "session",
                "login",
                { username: node.username, password: node.password || "" }
            ]
        }, { timeout: 8000 });

        if (ubusRes.data?.result?.[1]?.ubus_rpc_session) {
            return ubusRes.data.result[1].ubus_rpc_session;
        }
    } catch (e: any) {
        console.warn('UBUS auth failed, falling back to LuCI RPC...', e.message);
    }

    // 2. Try LuCI RPC (Legacy OpenWrt)
    const luciUrl = `${node.protocol}://${node.host}:${node.port}/cgi-bin/luci/rpc/auth`;
    try {
        const response = await axios.post(luciUrl, {
            id: 1,
            method: "login",
            params: [node.username, node.password || ""]
        }, { timeout: 8000 });

        if (response.data && response.data.result) {
            return response.data.result;
        }
        throw new Error('Invalid authentication response from router');
    } catch (error: any) {
        console.warn('Auth error for node:', node.host, error.message);
        throw new Error(`Connection failed: ${error.message} (Please check your IP/Port, and make sure HTTPS self-signed certs are handled correctly)`);
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
        const response = await axios.post(url, payload, { timeout: 8000 });
        const data = response.data.result?.[1] || {};
        // ubus returns load as integer * 65536 (Linux kernel fixed-point format)
        // e.g. 15808 → 15808/65536 ≈ 0.24
        const rawLoad: number[] = data.load || [0, 0, 0];
        const load: [number, number, number] = [
            parseFloat((rawLoad[0] / 65536).toFixed(2)),
            parseFloat((rawLoad[1] / 65536).toFixed(2)),
            parseFloat((rawLoad[2] / 65536).toFixed(2)),
        ];
        // Extract info - mapping ubus system info format to our NodeStats type
        return {
            cpu: 0,
            memory: {
                total: data.memory?.total || 0,
                available: data.memory?.free || 0,
            },
            load,
        };
    } catch (error) {
        console.warn('Fetch stats error:', error);
        throw error;
    }
};

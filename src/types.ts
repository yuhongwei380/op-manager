export interface OpenWrtNode {
  id: string;
  host: string;
  protocol: 'http' | 'https';
  port: string;
  username: string; // Default 'root'
  password?: string;
  remarks: string;
}

export interface NodeStats {
  cpu: number;
  memory: {
    total: number;
    available: number;
  };
  load: [number, number, number];
}

export interface PortInfo {
  id: string;
  proto: 'TCP' | 'UDP';
  localAddress: string;
  localPort: number;
  foreignAddress: string;
  state: string;
  pid: number;
  processName: string;
  memory: string;
  session: string;
  title: string;
  category: string;
  description: string;
  risk: 'Low' | 'Medium' | 'High';
  safe: boolean;
  details?: string;
  isLanPublic: boolean;
  lanExplanation: string;
  processTitle: string;
  recommendation: string;
  friendlyAnalogy?: string;
}

export interface NetworkInterface {
  name: string;
  address: string;
  url: string;
  isLocalhost: boolean;
  isLan: boolean;
  qrCode: string;
}

export interface NetworkInfo {
  hostname: string;
  port: number;
  primaryUrl: string;
  primaryIp: string;
  primaryQr: string;
  interfaces: NetworkInterface[];
}

export interface PortStats {
  total: number;
  listening: number;
  lanExposed: number;
  localhostOnly: number;
  established: number;
  processes: number;
}

export interface ScanResponse {
  ports: PortInfo[];
  timestamp: string;
  stats: PortStats;
}

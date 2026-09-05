// Comprehensive knowledge base for port numbers, services, and Windows processes.

export const PORT_DATABASE = {
  7: {
    name: 'Echo Protocol',
    category: 'System / Legacy',
    description: 'Ancient test protocol that simply bounces back whatever data is sent to it.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'TCPSVCS.EXE',
    details: 'Echo is an RFC 862 protocol originally designed for network testing. Today, it is rarely needed on production networks.'
  },
  9: {
    name: 'Discard Protocol',
    category: 'System / Legacy',
    description: 'Discards any data sent to it without response. Used for network performance testing.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'TCPSVCS.EXE'
  },
  13: {
    name: 'Daytime Protocol',
    category: 'System / Legacy',
    description: 'Returns the current date and time as an ASCII character string upon connection.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'TCPSVCS.EXE'
  },
  17: {
    name: 'Quote of the Day (QOTD)',
    category: 'System / Legacy',
    description: 'Returns a short quotation upon connection.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'TCPSVCS.EXE'
  },
  19: {
    name: 'Character Generator (CHARGEN)',
    category: 'System / Legacy',
    description: 'Generates a continuous stream of characters. Historically used for testing line printers and network buffers.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'TCPSVCS.EXE',
    details: 'Chargen can sometimes be abused in reflection denial-of-service attacks if exposed to the public internet.'
  },
  21: {
    name: 'FTP (File Transfer Protocol)',
    category: 'File Sharing / Network',
    description: 'Standard protocol for transferring computer files between a client and server.',
    safe: false,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'svchost.exe / FileZilla / IIS',
    details: 'Unencrypted file transfer. Anyone on the local network sniffing traffic could see usernames, passwords, and transferred files in plaintext. Use SFTP (port 22) or FTPS instead.'
  },
  22: {
    name: 'SSH (Secure Shell)',
    category: 'Remote Access',
    description: 'Encrypted remote login and terminal access to this computer.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    details: 'Allows remote command line access. If exposed to the LAN, anyone with a valid username and password or SSH key can log in.'
  },
  53: {
    name: 'DNS (Domain Name System)',
    category: 'Network Infrastructure',
    description: 'Translates human-readable domain names into IP addresses.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  80: {
    name: 'HTTP (Hypertext Transfer Protocol)',
    category: 'Web Server',
    description: 'Standard unencrypted web server. Often hosted by Windows IIS (via System PID 4), Apache, Nginx, or local dev tools.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'System / http.sys / nginx / apache',
    details: 'If bound to 0.0.0.0, any device on your Wi-Fi entering http://<your-ip> will see whatever website or API is being served.'
  },
  135: {
    name: 'Microsoft EPMAP / RPC (Remote Procedure Call)',
    category: 'Windows Core System',
    description: 'Core Windows endpoint mapper for DCOM and RPC services. Coordinates communication between Windows components.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'svchost.exe',
    details: 'Crucial for Windows domain networking, printer sharing, and WMI management. Should stay behind a trusted local network firewall.'
  },
  137: {
    name: 'NetBIOS Name Service',
    category: 'Windows Core System',
    description: 'Legacy Windows computer name resolution across local subnets.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  138: {
    name: 'NetBIOS Datagram Service',
    category: 'Windows Core System',
    description: 'Handles broadcast messages and browser service on legacy Windows networks.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  139: {
    name: 'NetBIOS Session Service',
    category: 'Windows Core System',
    description: 'Legacy file and printer sharing session layer over NetBIOS.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'System'
  },
  443: {
    name: 'HTTPS (Secure Web Server)',
    category: 'Web Server',
    description: 'Encrypted web traffic using TLS/SSL.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    details: 'Standard secure web server port. If hosting locally, allows encrypted web browsing.'
  },
  445: {
    name: 'Microsoft-DS / SMB (Server Message Block)',
    category: 'Windows Core System / File Sharing',
    description: 'Windows native file and printer sharing protocol. Allows other computers to mount your shared folders and network drives.',
    safe: true,
    risk: 'High',
    lanAccessible: true,
    commonProcess: 'System',
    details: 'Allows file sharing across the LAN. Historically targeted by exploits (like EternalBlue / WannaCry) if exposed to untrusted networks. Ensure your Windows sharing passwords are strong!'
  },
  554: {
    name: 'RTSP (Real Time Streaming Protocol)',
    category: 'Media Streaming',
    description: 'Streaming media control protocol used by Windows Media Player Network Sharing Service.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'wmpnetwk.exe',
    details: 'Allows smart TVs, game consoles, and DLNA devices on your home Wi-Fi to stream video/music from your laptop.'
  },
  1433: {
    name: 'Microsoft SQL Server',
    category: 'Database',
    description: 'Relational database management system by Microsoft.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'sqlservr.exe'
  },
  1521: {
    name: 'Oracle Database',
    category: 'Database',
    description: 'Oracle database listener for incoming client connections.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true
  },
  1900: {
    name: 'SSDP / UPnP (Universal Plug and Play)',
    category: 'Network Discovery',
    description: 'Discovers plug-and-play devices such as routers, printers, and smart TVs on the local network.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'svchost.exe'
  },
  2869: {
    name: 'UPnP Event Subsystem / SSDP',
    category: 'Windows Core System',
    description: 'Windows UPnP event notification listener for local devices.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'System'
  },
  2968: {
    name: 'EEventManager (Printer / Scanner Listener)',
    category: 'Hardware / Peripheral',
    description: 'EEventManager background listener for network scanners and printers.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'EEventManager.exe',
    details: 'Listens for scan/print button presses from Epson wireless multifunction printers on your Wi-Fi.'
  },
  3000: {
    name: 'Development Web Server (React / Node / Next.js)',
    category: 'Developer Environment',
    description: 'Default development port for create-react-app, Next.js, Express, NestJS, and Grafana.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'node.exe',
    details: 'If your dev server binds to 0.0.0.0, coworkers or other devices on your Wi-Fi can preview your web application in real-time.'
  },
  3306: {
    name: 'MySQL / MariaDB Database',
    category: 'Database',
    description: 'Popular open-source relational database server.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'mysqld.exe'
  },
  3389: {
    name: 'Microsoft Remote Desktop (RDP)',
    category: 'Remote Access',
    description: 'Windows Remote Desktop Protocol service for graphical remote access.',
    safe: true,
    risk: 'High',
    lanAccessible: true,
    commonProcess: 'svchost.exe / TermService',
    details: 'Allows anyone on the local network to open Remote Desktop Connection (mstsc) and see your Windows login screen. High value target for brute-force logins.'
  },
  4000: {
    name: 'Node / GraphQL / Hexo Dev Server',
    category: 'Developer Environment',
    description: 'Frequently used by GraphQL Apollo servers and static site generators.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'node.exe'
  },
  4200: {
    name: 'Angular CLI Dev Server',
    category: 'Developer Environment',
    description: 'Default HTTP development port for Angular CLI (`ng serve`).',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'node.exe'
  },
  5000: {
    name: 'Python Flask / ASP.NET / UPnP',
    category: 'Developer Environment',
    description: 'Default development port for Python Flask, ASP.NET Core, and Docker registries.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'python.exe / dotnet.exe'
  },
  5040: {
    name: 'Windows Connected Devices Service',
    category: 'Windows Core System',
    description: 'Coordinates connected device synchronization and cross-device phone integration.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'svchost.exe'
  },
  5173: {
    name: 'Vite Frontend Dev Server',
    category: 'Developer Environment',
    description: 'Default lightning-fast development server for Vite (React, Vue, Svelte).',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'node.exe',
    details: 'Supports hot-module reloading (HMR). When run with --host, exposes your web app to the local network.'
  },
  5353: {
    name: 'mDNS (Multicast DNS / Bonjour)',
    category: 'Network Discovery',
    description: 'Resolves hostnames on small networks without a local DNS server (e.g. yourlaptop.local).',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  5357: {
    name: 'WSDAPI (Web Services for Devices)',
    category: 'Windows Core System',
    description: 'Microsoft implementation of Web Services on Devices for discovering network printers and scanners.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'System'
  },
  5432: {
    name: 'PostgreSQL Database',
    category: 'Database',
    description: 'Powerful open-source object-relational database system.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'postgres.exe'
  },
  5900: {
    name: 'VNC Remote Desktop',
    category: 'Remote Access',
    description: 'Virtual Network Computing graphical desktop sharing.',
    safe: false,
    risk: 'High',
    lanAccessible: true
  },
  6379: {
    name: 'Redis In-Memory Cache',
    category: 'Database / Cache',
    description: 'In-memory key-value data store used as database, cache, and message broker.',
    safe: false,
    risk: 'High',
    lanAccessible: true,
    details: 'Redis has NO authentication by default! If exposed to LAN, anyone on your Wi-Fi could read, write, or flush your cached keys.'
  },
  7680: {
    name: 'Windows Delivery Optimization (P2P Update Sharing)',
    category: 'Windows Core System',
    description: 'P2P sharing service that lets Windows PCs on the same LAN share Windows Update downloads to save internet bandwidth.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'svchost.exe',
    details: 'When another Windows PC on your Wi-Fi needs an update that you already downloaded, your laptop can securely send it over LAN via this port.'
  },
  8000: {
    name: 'Common Web / Django / Python SimpleHTTPServer',
    category: 'Developer Environment',
    description: 'Standard alternative HTTP port, often used by Django, FastAPI, or `python -m http.server`.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'python.exe / node.exe'
  },
  8080: {
    name: 'HTTP Alternate / Spring Boot / Tomcat / Proxy',
    category: 'Web Server / Developer',
    description: 'Widely used secondary HTTP port for web proxies, Java Spring Boot, Apache Tomcat, and Jenkins.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  8081: {
    name: 'React Native Metro Bundler',
    category: 'Developer Environment',
    description: 'Development JavaScript bundler for React Native mobile apps.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'node.exe'
  },
  8443: {
    name: 'HTTPS Alternate / Tomcat SSL',
    category: 'Web Server',
    description: 'Secondary secure HTTPS port.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  8888: {
    name: 'Jupyter Notebook / Web Development',
    category: 'Data Science / Developer',
    description: 'Default port for Jupyter Notebook, JupyterLab, or MAMP.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'python.exe'
  },
  8989: {
    name: 'PortRadar Dashboard (This App!)',
    category: 'Network Tool / Dashboard',
    description: 'The Local Network Port Visualizer & Server Explainer Web App currently running on your laptop.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'node.exe',
    details: 'This is the server serving this visualization page. Open it from any phone or computer on your Wi-Fi!'
  },
  9000: {
    name: 'PHP-FPM / SonarQube / MinIO',
    category: 'Developer Environment',
    description: 'FastCGI process manager for PHP or MinIO S3 object storage.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  9090: {
    name: 'Prometheus Metrics / Web Cockpit',
    category: 'Monitoring / DevOps',
    description: 'Prometheus time-series metrics collector or server management cockpit.',
    safe: true,
    risk: 'Low',
    lanAccessible: true
  },
  9200: {
    name: 'Elasticsearch Search Engine',
    category: 'Search / Database',
    description: 'Distributed RESTful search and analytics engine.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true
  },
  9510: {
    name: 'Remote Desktop / Support Agent Listener',
    category: 'Remote Access / Utility',
    description: 'Local loopback port used by RemoteServerWin.exe.',
    safe: true,
    risk: 'Low',
    lanAccessible: false,
    commonProcess: 'RemoteServerWin.exe'
  },
  9512: {
    name: 'Remote Access Service Agent',
    category: 'Remote Access / Utility',
    description: 'Network discovery and communication port for RemoteServerWin.exe.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'RemoteServerWin.exe'
  },
  9993: {
    name: 'ZeroTier One Virtual Network Daemon',
    category: 'Virtual Mesh VPN',
    description: 'Peer-to-peer virtual Ethernet network controller. Connects devices across the internet as if on a single switch.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'zerotier-one_x64.exe',
    details: 'ZeroTier allows you to securely access devices on your own encrypted virtual overlay network.'
  },
  10243: {
    name: 'WCF / Microsoft HTTP Listener',
    category: 'Windows Core System',
    description: 'Windows Communication Foundation (WCF) or internal system HTTP receiver.',
    safe: true,
    risk: 'Low',
    lanAccessible: true,
    commonProcess: 'System'
  },
  11434: {
    name: 'Ollama Local AI Runner',
    category: 'Artificial Intelligence',
    description: 'REST API for running large language models (LLMs) locally on your laptop GPU/CPU.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'ollama.exe'
  },
  27017: {
    name: 'MongoDB NoSQL Database',
    category: 'Database',
    description: 'Document-oriented NoSQL database server.',
    safe: true,
    risk: 'Medium',
    lanAccessible: true,
    commonProcess: 'mongod.exe'
  },
  50000: {
    name: 'HttpToUsbBridge Server',
    category: 'Hardware / Bridge',
    description: 'HTTP-to-USB communications bridge. Allows web apps to interact directly with connected USB peripherals.',
    safe: true,
    risk: 'Low',
    lanAccessible: false,
    commonProcess: 'HttpToUsbBridge.exe',
    details: 'Bound to localhost (127.0.0.1) so only programs on this machine can send commands to USB hardware.'
  }
};

// Process-based fallback classification
export const PROCESS_DATABASE = {
  'svchost.exe': {
    title: 'Windows Service Host',
    category: 'Windows Core System',
    description: 'Standard Windows host process that runs multiple background Windows services (such as RPC, Network Discovery, and Delivery Optimization).',
    risk: 'Low',
    safe: true
  },
  'System': {
    title: 'Windows NT Kernel',
    category: 'Windows Core System',
    description: 'The core operating system kernel handling networking stacks (SMB 445, NetBIOS, HTTP.sys web server).',
    risk: 'Low',
    safe: true
  },
  'TCPSVCS.EXE': {
    title: 'Windows TCP/IP Simple Services',
    category: 'Windows Core System',
    description: 'Provides basic legacy test services (Echo, Discard, Daytime, QOTD, Chargen).',
    risk: 'Low',
    safe: true
  },
  'wmpnetwk.exe': {
    title: 'Windows Media Player Network Sharing',
    category: 'Media Streaming',
    description: 'Shares media libraries with other computers and DLNA media players on the local network.',
    risk: 'Low',
    safe: true
  },
  'zerotier-one_x64.exe': {
    title: 'ZeroTier One',
    category: 'Virtual Mesh VPN',
    description: 'Encrypted peer-to-peer overlay network daemon.',
    risk: 'Low',
    safe: true
  },
  'tailscaled.exe': {
    title: 'Tailscale VPN Daemon',
    category: 'Mesh VPN',
    description: 'WireGuard-based zero-config mesh VPN service connecting your personal devices.',
    risk: 'Low',
    safe: true
  },
  'HttpToUsbBridge.exe': {
    title: 'HTTP to USB Bridge',
    category: 'Hardware / Peripheral',
    description: 'Local background bridge that exposes connected USB devices to web or local clients.',
    risk: 'Low',
    safe: true
  },
  'node.exe': {
    title: 'Node.js JavaScript Runtime',
    category: 'Developer Environment',
    description: 'High-performance JavaScript runtime powering local web servers, development environments (Vite/React), and APIs.',
    risk: 'Low',
    safe: true
  },
  'python.exe': {
    title: 'Python Runtime',
    category: 'Developer Environment',
    description: 'Python interpreter hosting web servers (Django, Flask, FastAPI), data science tools, or automation scripts.',
    risk: 'Low',
    safe: true
  },
  'Antigravity.exe': {
    title: 'Antigravity IDE',
    category: 'Developer Tools',
    description: 'Integrated Development Environment process hosting language servers and local debugging proxies.',
    risk: 'Low',
    safe: true
  },
  'language_server.exe': {
    title: 'Language Server Protocol Daemon',
    category: 'Developer Tools',
    description: 'Code intelligence server providing autocompletion, diagnostics, and semantic analysis to your editor.',
    risk: 'Low',
    safe: true
  }
};

/**
 * Returns complete explanation object for a port and process
 */
export function explainPort(port, processName = '', localAddress = '') {
  const portNum = parseInt(port, 10);
  const knownPort = PORT_DATABASE[portNum];
  const knownProc = PROCESS_DATABASE[processName] || {};

  // Check dynamic RPC port range on Windows (49152 - 65535)
  const isDynamicRange = portNum >= 49152 && portNum <= 65535;
  const isDynamicRpc = isDynamicRange && (processName.toLowerCase() === 'svchost.exe' || processName.toLowerCase() === 'system');

  let title = knownPort?.name;
  let category = knownPort?.category;
  let description = knownPort?.description;
  let risk = knownPort?.risk || 'Low';
  let details = knownPort?.details;

  if (!title) {
    if (isDynamicRpc) {
      title = `Windows Dynamic RPC Endpoint (${portNum})`;
      category = 'Windows Core System';
      description = 'Dynamically allocated high port assigned to a Windows service or RPC endpoint on startup.';
      details = 'Windows dynamically allocates ports in the 49152-65535 range for outbound RPC connections and COM interfaces.';
    } else if (knownProc.title) {
      title = `${knownProc.title} (Port ${portNum})`;
      category = knownProc.category || 'Application Service';
      description = knownProc.description || `Service managed by ${processName}.`;
    } else {
      title = `Custom Service on Port ${portNum}`;
      category = isDynamicRange ? 'Dynamic / Ephemeral' : 'Registered Service';
      description = `An active server or service hosted by process ${processName || 'Unknown'}.`;
    }
  }

  // Exposure analysis based on binding address
  const cleanAddr = localAddress.replace(/^\[|\]$/g, '');
  const isLanPublic = cleanAddr.startsWith('0.0.0.0') || 
                      cleanAddr === '*' || 
                      cleanAddr === '::' || 
                      cleanAddr.startsWith('192.168.') || 
                      cleanAddr.startsWith('10.') || 
                      (cleanAddr.startsWith('172.') && parseInt(cleanAddr.split('.')[1], 10) >= 16 && parseInt(cleanAddr.split('.')[1], 10) <= 31);

  let lanExplanation = '';
  if (isLanPublic) {
    lanExplanation = `⚠️ OPEN TO LOCAL NETWORK: This server is bound to ${localAddress}. Anyone connected to your Wi-Fi can reach this port at http://<your-ip>:${portNum}`;
  } else {
    lanExplanation = `🔒 LOCALHOST ONLY: Bound to ${localAddress}. Only applications running directly on this laptop can communicate with this port.`;
  }

  // Friendly everyday analogy for users without deep technical background
  let friendlyAnalogy = '';
  if ([80, 8080, 5000, 3000, 5173, 9000, 9090].includes(portNum)) {
    friendlyAnalogy = 'Like a store front door or website welcome counter where web pages are served to visitors.';
  } else if (portNum === 443 || portNum === 8443) {
    friendlyAnalogy = 'Like a secure bank drive-through window with bulletproof encrypted glass for private, secure web traffic.';
  } else if (portNum === 53) {
    friendlyAnalogy = 'Like your phone’s address book—it converts human website names (google.com) into computer phone numbers (IP addresses).';
  } else if (portNum === 5353) {
    friendlyAnalogy = 'Like calling out in a living room: "Who has a printer or smart TV?" so nearby devices can discover each other automatically.';
  } else if (portNum === 135 || portNum === 445) {
    friendlyAnalogy = 'Like an internal intercom system inside Windows that apps and file shares use to talk behind the scenes.';
  } else if (portNum === 8989) {
    friendlyAnalogy = 'This is PortRadar itself! It acts like a lighthouse radar broadcasting this visual dashboard to your browser and local Wi-Fi.';
  } else if (isDynamicRpc || isDynamicRange) {
    friendlyAnalogy = 'Like a temporary numbered ticket at a service counter that Windows opened for a quick background task, and will tear up when done.';
  } else {
    friendlyAnalogy = `A dedicated communication channel for ${processName || 'this program'}, allowing it to send or receive information over your network.`;
  }

  return {
    port: portNum,
    title,
    category: category || 'General Network',
    description,
    risk,
    safe: knownPort ? knownPort.safe : true,
    details: details || '',
    isLanPublic,
    lanExplanation,
    processTitle: knownProc.title || processName,
    friendlyAnalogy,
    recommendation: isLanPublic && (risk === 'High' || !knownPort?.safe)
      ? 'Ensure your laptop is connected to a Private network with Windows Firewall active, or configure this application to bind only to 127.0.0.1.'
      : 'Standard active port. Operating normally.'
  };
}

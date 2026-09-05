# ⚡ PortRadar - Local Network Port Visualizer & Server Explainer

PortRadar is a modern, lightweight web application that runs on your Windows laptop, continuously scans all active network ports and listening servers, visualizes them in an interactive orbital radar and spectrum map, and provides plain-English explanations of what each server means and whether it is exposed to devices on your local Wi-Fi.

---

## 🚀 Quick Start

### Option 1: One-Click Launcher (Windows)
Double-click `start-port-radar.bat` in this folder. It will start the server on port `8989` and automatically open your default browser.

### Option 2: Command Line
```bash
# Start the server (already built)
npm start

# Or to rebuild and start
npm run start:all
```

---

## 🌐 Local Network (LAN) Access

Because the server is bound to `0.0.0.0:8989`, anyone connected to the same Wi-Fi or local area network (LAN) can access the visualization!

1. Open PortRadar on your laptop (`http://localhost:8989`).
2. Look at the top banner: it displays your laptop's local IP address (e.g. `http://192.168.0.105:8989`).
3. Click **"Phone QR Code"** to display the QR code.
4. Scan the QR code with any smartphone or tablet on the same Wi-Fi network to view the live dashboard instantly!

> **Note on Windows Firewall**: If another device cannot connect, Windows Firewall may be blocking inbound connections on private networks. You can allow port 8989 with this quick PowerShell command (run as Administrator):
> ```powershell
> New-NetFirewallRule -DisplayName "PortRadar Web Dashboard" -Direction Inbound -LocalPort 8989 -Protocol TCP -Action Allow
> ```

---

## ✨ Features

- **Interactive Orbital Radar Map**: Live radial visualization showing your laptop at the center with orbits for system core ports (< 1024), application & dev servers (1024 - 20000), and dynamic high ports (> 20000).
- **Port Spectrum Matrix (0 - 65,535)**: Visual heatmap band showing the density and distribution of active ports across the entire port space.
- **Plain-English Server Knowledge Base**: Explains what each server is doing (e.g., Windows RPC, SMB File Sharing, Vite Dev Server, Node.js, HTTP.sys, ZeroTier, etc.).
- **LAN Security & Exposure Analyzer**:
  - ⚠️ **LAN Public (`0.0.0.0`)**: Warns when a port is open to anyone on the Wi-Fi.
  - 🔒 **Localhost Protected (`127.0.0.1`)**: Indicates when a port is restricted to internal communications on this machine only.
- **Process & Memory Diagnostics**: Displays Process Name, PID, session type, and memory consumption.
- **Action Center**:
  - "Open in Browser" for HTTP web servers.
  - "Copy curl test" command.
  - Safe **"Stop Process"** button to terminate processes and free up ports directly from the UI (with built-in safeguards protecting Windows system core processes).
- **Auto-Refresh**: Live updates every 3 seconds or manual instant refresh.

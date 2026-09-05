import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const releaseDir = path.join(rootDir, 'release');
const stageDir = path.join(releaseDir, 'PortRadar-Windows-x64');
const zipFile = path.join(releaseDir, 'PortRadar-Windows-x64.zip');

console.log('🚀 Packaging PortRadar Portable Windows Release...');

// Clean stage dir
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
  fs.rmSync(zipFile, { force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Copy dist
console.log('📦 Copying dist bundle...');
fs.cpSync(path.join(rootDir, 'dist'), path.join(stageDir, 'dist'), { recursive: true });

// Copy server
console.log('📦 Copying server code...');
fs.cpSync(path.join(rootDir, 'server'), path.join(stageDir, 'server'), { recursive: true });

// Copy launchers
console.log('📦 Copying launchers & documentation...');
fs.copyFileSync(path.join(rootDir, 'start-port-radar.bat'), path.join(stageDir, 'start-port-radar.bat'));
fs.copyFileSync(path.join(rootDir, 'start-port-radar.bat'), path.join(stageDir, 'PortRadar.bat'));
fs.copyFileSync(path.join(rootDir, 'README.md'), path.join(stageDir, 'README.md'));

// Minimal package.json for production
const prodPackage = {
  name: "portradar",
  version: "1.0.0",
  type: "module",
  dependencies: {
    "express": "^5.2.1",
    "cors": "^2.8.6",
    "qrcode": "^1.5.4"
  }
};
fs.writeFileSync(path.join(stageDir, 'package.json'), JSON.stringify(prodPackage, null, 2));

// Install only production dependencies in stageDir
console.log('📦 Installing production dependencies in release package...');
execSync('npm install --omit=dev', { cwd: stageDir, stdio: 'inherit' });

// Copy node.exe to bin/ so users without Node.js can run it
const systemNode = 'C:\\Program Files\\nodejs\\node.exe';
if (fs.existsSync(systemNode)) {
  console.log('📦 Bundling portable Node.js runtime into bin/node.exe...');
  const binDir = path.join(stageDir, 'bin');
  fs.mkdirSync(binDir, { recursive: true });
  fs.copyFileSync(systemNode, path.join(binDir, 'node.exe'));
}

// Create ZIP archive using Windows native tar (lightning fast)
console.log('🗜️ Compressing ZIP archive with tar.exe...');
execSync(`tar.exe -a -c -f "${zipFile}" -C "${releaseDir}" "PortRadar-Windows-x64"`, { stdio: 'inherit' });

const stats = fs.statSync(zipFile);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`\n✅ Portable release created successfully!\nPath: ${zipFile}\nSize: ${sizeMb} MB\n`);

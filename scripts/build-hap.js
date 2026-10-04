const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. Resolve SDK path
let sdkDir = process.env.DEVECO_SDK_HOME;
if (!sdkDir) {
  const localPropsPath = path.join(rootDir, 'local.properties');
  if (fs.existsSync(localPropsPath)) {
    const content = fs.readFileSync(localPropsPath, 'utf8');
    const match = content.match(/sdk\.dir\s*=\s*(.+)/);
    if (match) {
      sdkDir = match[1].trim().replace(/\\\\/g, '\\');
    }
  }
}
if (!sdkDir || !fs.existsSync(sdkDir)) {
  const defaultDevEco = 'C:\\Program Files\\Huawei\\DevEco Studio\\sdk';
  if (fs.existsSync(defaultDevEco)) {
    sdkDir = defaultDevEco;
  }
}

// 2. Resolve hvigorw executable
let hvigorwPath = null;
const possibleHvigorw = [
  'C:\\Program Files\\Huawei\\DevEco Studio\\tools\\hvigor\\bin\\hvigorw.bat',
  'C:\\Program Files\\Huawei\\DevEco Studio\\tools\\hvigor\\bin\\hvigorw',
];
for (const p of possibleHvigorw) {
  if (fs.existsSync(p)) {
    hvigorwPath = p;
    break;
  }
}

if (!hvigorwPath) {
  console.error('Error: hvigorw not found. Please ensure DevEco Studio is installed.');
  process.exit(1);
}

console.log(`[build:hap] Using SDK: ${sdkDir}`);
console.log(`[build:hap] Using hvigorw: ${hvigorwPath}`);

const env = {
  ...process.env,
  DEVECO_SDK_HOME: sdkDir,
};

const cmd = process.platform === 'win32' ? `"${hvigorwPath}"` : hvigorwPath;

const result = spawnSync(cmd, ['assembleHap', '--no-daemon'], {
  cwd: rootDir,
  env,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) {
  console.error(`[build:hap] Build failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

const hapPath = path.join(rootDir, 'entry', 'build', 'default', 'outputs', 'default', 'entry-default-unsigned.hap');
if (fs.existsSync(hapPath)) {
  const stats = fs.statSync(hapPath);
  console.log(`\n========================================`);
  console.log(`✅ OpenHarmony .hap package built successfully!`);
  console.log(`Path: ${hapPath}`);
  console.log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`========================================\n`);
} else {
  console.log(`[build:hap] Build completed.`);
}

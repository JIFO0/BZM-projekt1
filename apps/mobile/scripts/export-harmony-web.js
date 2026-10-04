const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

process.env.EXPO_HARMONY_WEB = '1';

const outputDir = path.resolve(__dirname, '../../../entry/src/main/resources/rawfile/www');

function relativizeExportedWeb(dir) {
  const indexPath = path.join(dir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/\s(href|src)="\/(?!\/)/g, ' $1="');
  fs.writeFileSync(indexPath, html);

  const webJsDir = path.join(dir, '_expo', 'static', 'js', 'web');
  if (!fs.existsSync(webJsDir)) {
    return;
  }
  for (const name of fs.readdirSync(webJsDir)) {
    if (!name.endsWith('.js')) {
      continue;
    }
    const filePath = path.join(webJsDir, name);
    const source = fs.readFileSync(filePath, 'utf8');
    const rewritten = source.replace(/"\/assets\//g, '"assets/').replace(/'\/assets\//g, "'assets/");
    if (rewritten !== source) {
      fs.writeFileSync(filePath, rewritten);
    }
  }
}

const child = spawn(
  'npx',
  ['expo', 'export', '--platform', 'web', '--output-dir', outputDir],
  { stdio: 'inherit', shell: true, cwd: path.resolve(__dirname, '..'), env: process.env }
);

child.on('exit', (code) => {
  if (code === 0) {
    relativizeExportedWeb(outputDir);
  }
  process.exit(code ?? 1);
});

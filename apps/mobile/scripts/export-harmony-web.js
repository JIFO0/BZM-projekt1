const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

process.env.EXPO_HARMONY_WEB = '1';

const outputDir = path.resolve(__dirname, '../../../entry/src/main/resources/rawfile/www');

function relativizeExportedWeb(dir) {
  const indexPath = path.join(dir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/\s(href|src)="\/(?!\/)/g, ' $1="');
  if (!html.includes('harmony-boot-error')) {
    html = html.replace(
      '<title>',
      '<script>(function(){var href=String(location.href||"");var raw=href.indexOf("rawfile")!==-1||href.indexOf("resource:")===0;if(!raw)return;function show(text){var node=document.getElementById("harmony-boot-error");if(!node){node=document.createElement("pre");node.id="harmony-boot-error";node.setAttribute("style","position:fixed;left:0;right:0;top:0;bottom:0;z-index:2147483647;margin:0;padding:24px;background:#111;color:#fff;font:16px/1.4 sans-serif;white-space:pre-wrap;overflow:auto");(document.body||document.documentElement).appendChild(node)}node.textContent+=text+"\\n"}window.addEventListener("error",function(event){var target=event.target;if(target&&target.src){show("Nie wczytano: "+target.src);return}show(String(event.message||"error")+"\\n"+(event.filename||"")+":"+(event.lineno||0))},true);var clean=href.split("#")[0].split("?")[0];var dir=clean.replace(/[^/]*$/,"");var base=document.createElement("base");base.href=dir;var head=document.head||document.getElementsByTagName("head")[0];if(head.firstChild){head.insertBefore(base,head.firstChild)}else{head.appendChild(base)}try{history.replaceState(null,"","/")}catch(error){show("Router: "+(error&&error.message?error.message:error))}})();</script><title>'
    );
  }
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

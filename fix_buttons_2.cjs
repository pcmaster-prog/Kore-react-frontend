const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src/features');
function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.tsx')) {
      files.push(name);
    }
  }
  return files;
}

const allTsx = getFiles(dir);

for (const f of allTsx) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/<button([^>]*?)bg-k-bg-sidebar([^>]*?)text-white/g, '<button$1bg-k-accent-btn$2text-k-accent-btn-text');
  content = content.replace(/<button([^>]*?)text-white([^>]*?)bg-k-bg-sidebar/g, '<button$1text-k-accent-btn-text$2bg-k-accent-btn');
  fs.writeFileSync(f, content, 'utf8');
}

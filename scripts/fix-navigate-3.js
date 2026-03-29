const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walkDir(p, callback);
    } else {
      callback(p);
    }
  }
}

let count = 0;
walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let code = fs.readFileSync(filePath, 'utf8');
  let original = code;

  // fixing router.navigate({ to: '/login' } as any })
  code = code.replace(/\} as any \}\)/g, "as any })");
  code = code.replace(/\} as any \}\ \}\)/g, "as any })");

  if (code !== original) {
    fs.writeFileSync(filePath, code);
    count++;
  }
});
console.log('Fixed extra brackets in ' + count + ' files.');

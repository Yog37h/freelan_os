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
  let changed = false;

  // Search for: router.navigate({ to: '/something')
  // We want to replace it with: router.navigate({ to: '/something' })
  // Using generic regex.
  const regex = /router\.navigate\(\{\s*to:\s*(.*?)\)(?!(\}| as any\}))/g;
  if (code.match(regex)) {
    code = code.replace(regex, "router.navigate({ to: $1 as any })");
    changed = true;
  }

  // Next.js params bug
  if (code.includes('params.get(')) {
    // If we changed to TanStack router searchParams (which is an object), `.get()` breaks.
    code = code.replace(/searchParams\.get\((['"])(.*?)(['"])\)/g, "searchParams[$1$2$3]");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, code);
    count++;
  }
});
console.log('Fixed syntax in ' + count + ' files.');

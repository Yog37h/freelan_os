import fs from 'fs';
import path from 'path';

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

walkDir('./frontend/src', (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let code = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Next.js Link
  if (code.includes('next/link')) {
    code = code.replace(/import Link from ['"]next\/link['"];?/g, "import { Link } from '@tanstack/react-router';");
    code = code.replace(/<Link\s+(.*?)href=(['"{])/g, "<Link $1to=$2");
    changed = true;
  }

  // Next.js Router
  if (code.includes('next/navigation')) {
    code = code.replace(/import {.*?useRouter.*?} from ['"]next\/navigation['"];?/g, "import { useNavigate as __useNavigate } from '@tanstack/react-router';");
    code = code.replace(/useRouter\(\)/g, "__useNavigate()");
    code = code.replace(/\.push\(/g, ".navigate({ to: ");
    code = code.replace(/\brouter\.navigate\(\{ to: (.*)\}\)/g, "router.navigate({ to: $1 })"); // cleanup
    changed = true;
  }

  // Next.js metadata and server-specific stuff
  code = code.replace(/export const metadata.*?=.*?;/sg, '');
  code = code.replace(/"use client";?/g, '');
  code = code.replace(/'use client';?/g, '');

  if (changed) {
    fs.writeFileSync(filePath, code);
  }
});
console.log('Frontend basic migration done.');

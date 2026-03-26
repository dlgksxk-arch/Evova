import fs from 'fs';
import path from 'path';

const sampleDir = path.resolve(process.cwd(), 'dist', 'sample');

if (fs.existsSync(sampleDir)) {
  fs.rmSync(sampleDir, { recursive: true, force: true });
  console.log(`Removed app bundle sample assets: ${sampleDir}`);
} else {
  console.log(`No sample assets to remove: ${sampleDir}`);
}

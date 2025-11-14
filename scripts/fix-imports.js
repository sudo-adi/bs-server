const fs = require('fs');
const path = require('path');

function getAllJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getAllJsFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace @/generated/prisma/runtime/library with relative path to dist/generated/prisma/runtime/library
  if (content.includes("@/generated/prisma/runtime/library")) {
    const distDir = path.join(__dirname, '..', 'dist');
    const relativePath = path.relative(path.dirname(filePath), path.join(distDir, 'generated', 'prisma', 'runtime', 'library'));
    const normalizedPath = relativePath.split(path.sep).join('/');
    
    content = content.replace(
      /@\/generated\/prisma\/runtime\/library/g,
      normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath
    );
    modified = true;
  }
  
  // Replace @/generated/prisma with relative path to dist/generated/prisma
  if (content.includes("@/generated/prisma")) {
    const distDir = path.join(__dirname, '..', 'dist');
    const relativePath = path.relative(path.dirname(filePath), path.join(distDir, 'generated', 'prisma'));
    const normalizedPath = relativePath.split(path.sep).join('/');
    
    content = content.replace(
      /@\/generated\/prisma(?!\/runtime\/library)/g,
      normalizedPath.startsWith('.') ? normalizedPath : './' + normalizedPath
    );
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

const distDir = path.join(__dirname, '..', 'dist');
const jsFiles = getAllJsFiles(distDir);

console.log(`Processing ${jsFiles.length} files...`);
jsFiles.forEach(fixImportsInFile);
console.log('Import fixing complete!');

const fs = require('fs');

const csv = fs.readFileSync('data.csv', 'utf8');
const lines = csv.split('\n');
const header = lines[0];

function convertDate(dateStr) {
  if (!dateStr) return '';
  const [month, day, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function padEsic(esic) {
  if (!esic) return '';
  const numStr = esic.replace(/\s+/g, '');
  return numStr.padStart(17, '0');
}

const fixedLines = [header];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;

  const parts = [];
  let current = '';
  let inQuotes = false;

  for (let j = 0; j < lines[i].length; j++) {
    const char = lines[i][j];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);

  // Fix date (column 8 - date_of_birth)
  if (parts[8]) {
    parts[8] = convertDate(parts[8]);
  }

  // Fix ESIC (column 35 - esic_number)
  if (parts[35]) {
    parts[35] = padEsic(parts[35]);
  }

  fixedLines.push(parts.join(','));
}

fs.writeFileSync('data.csv', fixedLines.join('\n'), 'utf8');
console.log(`Fixed ${fixedLines.length - 1} rows`);
console.log('- Date format: M/D/YYYY -> YYYY-MM-DD');
console.log('- ESIC numbers padded to 17 digits');

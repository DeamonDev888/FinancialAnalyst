
const fs = require('fs');
try {
  const content = fs.readFileSync('opml_debug_v2.txt', 'utf8'); // Try utf8 first
  console.log(content);
} catch (e) {
  try {
    const content = fs.readFileSync('opml_debug_v2.txt', 'utf16le'); // Try utf16le
    console.log(content);
  } catch (e2) {
    console.error('Failed to read file:', e2);
  }
}

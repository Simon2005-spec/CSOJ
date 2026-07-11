const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

// Title Block
const titleBlockStart = code.indexOf('{/* Title */}');
const idBlockStart = code.indexOf('{/* ID */}');
const diffBlockStart = code.indexOf('{/* Difficulty */}');

if (titleBlockStart === -1 || idBlockStart === -1 || diffBlockStart === -1) {
    console.log("Could not find blocks");
    process.exit(1);
}

const titleBlock = code.substring(titleBlockStart, idBlockStart);
const idBlock = code.substring(idBlockStart, diffBlockStart);

// Swap them
const newCode = code.substring(0, titleBlockStart) + idBlock + titleBlock + code.substring(diffBlockStart);
fs.writeFileSync('src/components/AdminSection.tsx', newCode);
console.log("Swap successful");

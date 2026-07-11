const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

const s2Start = code.indexOf('{/* Section 2: Examples Builder */}');
const s3Start = code.indexOf('{/* Section 3: Automated Testing Testcases (The Engine) */}');
const s4Start = code.indexOf('<div className="liquid-glass" style={{ padding: \'1.5rem\'');

if (s2Start === -1 || s3Start === -1 || s4Start === -1) {
    console.log("Could not find blocks");
    process.exit(1);
}

// Ensure s4Start is actually the start of section 4
const actualS4Start = code.indexOf('          {/* Form Actions Buttons */}');
const s4TrueStart = code.lastIndexOf('<div className="liquid-glass"', actualS4Start);


const s2Block = code.substring(s2Start, s3Start);
const s3Block = code.substring(s3Start, s4TrueStart);

const newCode = code.substring(0, s2Start) + s3Block + s2Block + code.substring(s4TrueStart);
fs.writeFileSync('src/components/AdminSection.tsx', newCode);
console.log("Swap 2 & 3 successful");

const fs = require('fs');
let code = fs.readFileSync('src/components/AdminSection.tsx', 'utf8');

const startIdx = code.indexOf('{/* Description Textarea with HTML insertion tools */}');
if (startIdx === -1) {
  console.log("Could not find start");
  process.exit(1);
}

const endMarker = '          {/* Section 2: Examples Builder */}';
let endIdx = code.indexOf(endMarker);
if (endIdx === -1) {
    console.log("Could not find end marker");
    process.exit(1);
}

// walk back to find the closing div of Description section
// The block is inside the "Section 1" liquid-glass div. We want to move just the Description Textarea div.
// Wait, is it inside Section 1? Let's find the closing div just before endMarker.
let subcode = code.substring(startIdx, endIdx);
let divEnd = subcode.lastIndexOf('</div>');
// It should be around `</div>\n          </div>\n\n          {/* Section 2`
// Let's just move everything from startIdx to endIdx - 20 (where the parent div closes)
// Actually it's safer to extract from startIdx up to endIdx, but we have to leave the parent `</div>` intact.

let parentDivEnd = subcode.lastIndexOf('</div>', divEnd - 1); // finding the closing div of form-group
let extractEndIdx = startIdx + parentDivEnd + 6;

const blockToMove = code.substring(startIdx, extractEndIdx);
console.log("Block to move length:", blockToMove.length);

let newCode = code.substring(0, startIdx) + code.substring(extractEndIdx);

const formActionsMarker = '{/* Form Actions Buttons */}';
const insertIdx = newCode.indexOf(formActionsMarker);

if (insertIdx === -1) {
    console.log("Could not find insert marker");
    process.exit(1);
}

newCode = newCode.substring(0, insertIdx) + 
`          <div className="liquid-glass" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-element)', paddingBottom: '0.5rem' }}>
              <FileText size={18} style={{ color: '#10b981' }} />
              <span>4. Nội dung chi tiết đề bài</span>
            </h2>
            ` + blockToMove + `
          </div>\n\n          ` + newCode.substring(insertIdx);

fs.writeFileSync('src/components/AdminSection.tsx', newCode);
console.log("Rewrite successful");

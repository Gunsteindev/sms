const fs = require('fs');
const path = require('path');
const base = 'C:/Users/JaphetKomlanElormPas/School Management System/sms/src/app/(dashboard)';

function skipString(str, i) {
  const q = str[i];
  i++;
  while (i < str.length) {
    if (str[i] === '\\') { i += 2; continue; }
    if (str[i] === q) return i + 1;
    i++;
  }
  return i;
}

function skipTemplateLiteral(str, i) {
  i++; // skip opening backtick
  while (i < str.length) {
    if (str[i] === '\\') { i += 2; continue; }
    if (str[i] === '$' && str[i + 1] === '{') {
      i += 2;
      let depth = 1;
      while (i < str.length && depth > 0) {
        if (str[i] === '{') depth++;
        else if (str[i] === '}') depth--;
        else if (str[i] === '`') i = skipTemplateLiteral(str, i) - 1;
        else if (str[i] === '"' || str[i] === "'") i = skipString(str, i) - 1;
        i++;
      }
      continue;
    }
    if (str[i] === '`') return i + 1;
    i++;
  }
  return i;
}

// Find matching closing brace from position i (which should be on '{')
function findClosingBrace(str, i) {
  let depth = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return i; }
    else if (ch === '`') { i = skipTemplateLiteral(str, i) - 1; }
    else if (ch === '"' || ch === "'") { i = skipString(str, i) - 1; }
    i++;
  }
  return -1;
}

// Extract JSX attribute value starting at '=' sign position
function extractAttrValue(str, eqPos) {
  let i = eqPos + 1; // skip '='
  if (str[i] === '{') {
    const close = findClosingBrace(str, i);
    if (close === -1) return null;
    return str.slice(i + 1, close);
  }
  if (str[i] === '"') {
    const close = str.indexOf('"', i + 1);
    return str.slice(i + 1, close);
  }
  return null;
}

function getAttr(tag, name) {
  const needle = name + '=';
  let i = tag.indexOf(needle);
  if (i === -1) return null;
  return extractAttrValue(tag, i + needle.length - 1);
}

function toOnOpenChange(onClose) {
  onClose = onClose.trim();
  if (!onClose.includes('=>') && !onClose.includes('function')) {
    return `(o) => { if (!o) ${onClose}(); }`;
  }
  const blockMatch = onClose.match(/^\(\s*\)\s*=>\s*\{([\s\S]*)\}$/);
  if (blockMatch) {
    const body = blockMatch[1].trim();
    return `(o) => { if (!o) { ${body} } }`;
  }
  const exprMatch = onClose.match(/^\(\s*\)\s*=>\s*([\s\S]+)$/);
  if (exprMatch) {
    const expr = exprMatch[1].trim().replace(/;$/, '');
    return `(o) => { if (!o) { ${expr}; } }`;
  }
  return `(o) => { if (!o) (${onClose})(); }`;
}

function transformFile(content) {
  let result = content;
  let changed = false;
  let safetyLimit = 20;

  while (safetyLimit-- > 0) {
    const idx = result.indexOf('<Modal');
    if (idx === -1) break;

    const afterModal = result[idx + 6];
    if (afterModal !== ' ' && afterModal !== '\n' && afterModal !== '\r' && afterModal !== '\t') {
      // Not a Modal tag, skip (shouldn't happen but guard it)
      break;
    }

    // Find end of opening tag
    let depth = 0, i = idx + 6, tagEnd = -1;
    while (i < result.length) {
      const ch = result[i];
      if (ch === '{') { const close = findClosingBrace(result, i); if (close !== -1) { i = close; } }
      else if (ch === '`') { i = skipTemplateLiteral(result, i) - 1; }
      else if (ch === '"' || ch === "'") { i = skipString(result, i) - 1; }
      else if (ch === '>') { tagEnd = i; break; }
      i++;
    }
    if (tagEnd === -1) break;
    if (result[tagEnd - 1] === '/') break; // self-closing

    const openingTag = result.slice(idx, tagEnd + 1);
    const isOpen = getAttr(openingTag, 'isOpen');
    const onClose = getAttr(openingTag, 'onClose');
    const title = getAttr(openingTag, 'title');

    if (!isOpen || !onClose) break;

    const closeIdx = result.indexOf('</Modal>', tagEnd);
    if (closeIdx === -1) break;

    const children = result.slice(tagEnd + 1, closeIdx);
    const onOpenChange = toOnOpenChange(onClose);

    const lineStart = result.lastIndexOf('\n', idx) + 1;
    const indent = result.slice(lineStart, idx).match(/^(\s*)/)[1];
    const titleExpr = title !== null ? title : '';

    const replacement =
`<Dialog open={${isOpen}} onOpenChange={${onOpenChange}}>
${indent}  <DialogContent className="sm:max-w-lg">
${indent}    <DialogHeader>
${indent}      <DialogTitle>${titleExpr}</DialogTitle>
${indent}    </DialogHeader>${children}${indent}  </DialogContent>
${indent}</Dialog>`;

    result = result.slice(0, idx) + replacement + result.slice(closeIdx + 8);
    changed = true;
  }

  return { content: result, changed };
}

const files = [
  'library/page.tsx', 'teachers/page.tsx', 'students/page.tsx', 'subjects/page.tsx',
  'finance/scholarships/page.tsx', 'setup/academic-years/page.tsx', 'exams/page.tsx',
  'timetable/page.tsx', 'employees/page.tsx', 'setup/grade-levels/page.tsx',
  'attendance/page.tsx', 'finance/fees/page.tsx', 'classes/page.tsx',
  'finance/fee-payments/page.tsx', 'setup/terms/page.tsx', 'departments/page.tsx',
  'enrollments/page.tsx', 'fees/page.tsx', 'students/[id]/page.tsx',
];

let updated = 0;
for (const f of files) {
  const fp = path.join(base, f);
  const content = fs.readFileSync(fp, 'utf8');
  const { content: newContent, changed } = transformFile(content);
  if (changed) {
    fs.writeFileSync(fp, newContent, 'utf8');
    updated++;
    console.log('Transformed:', f);
  } else {
    console.log('No change:', f);
  }
}
console.log('\nTotal files updated:', updated);

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

function checkFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagName = node.openingElement ? node.openingElement.tagName.getText() : node.tagName.getText();
      if (tagName === 'AnimatePresence') {
        const children = node.children;
        children.forEach(child => {
          if (ts.isJsxExpression(child) && child.expression) {
             if (ts.isBinaryExpression(child.expression) && child.expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) {
                 const right = child.expression.right;
                 let elem = right;
                 if (ts.isParenthesizedExpression(elem)) elem = elem.expression;
                 if (ts.isJsxElement(elem) || ts.isJsxSelfClosingElement(elem)) {
                     const attributes = elem.openingElement ? elem.openingElement.attributes : elem.attributes;
                     const hasKey = attributes.properties.some(p => p.name && p.name.getText() === 'key');
                     if (!hasKey) {
                         const { line, character } = sourceFile.getLineAndCharacterOfPosition(elem.getStart());
                         console.log(`[!] Missing key on conditional child of AnimatePresence: ${file}:${line+1}:${character+1}`);
                     }
                 } else if (ts.isCallExpression(elem)) {
                     const { line, character } = sourceFile.getLineAndCharacterOfPosition(elem.getStart());
                     console.log(`[?] Call expression inside AnimatePresence condition (IIFE?): ${file}:${line+1}:${character+1}`);
                 }
             } else if (ts.isConditionalExpression(child.expression)) {
                 const whenTrue = child.expression.whenTrue;
                 const whenFalse = child.expression.whenFalse;
                 [whenTrue, whenFalse].forEach(elem => {
                     let e = elem;
                     if (ts.isParenthesizedExpression(e)) e = e.expression;
                     if (ts.isJsxElement(e) || ts.isJsxSelfClosingElement(e)) {
                         const attributes = e.openingElement ? e.openingElement.attributes : e.attributes;
                         const hasKey = attributes.properties.some(p => p.name && p.name.getText() === 'key');
                         if (!hasKey) {
                             const { line, character } = sourceFile.getLineAndCharacterOfPosition(e.getStart());
                             console.log(`[!] Missing key on ternary child of AnimatePresence: ${file}:${line+1}:${character+1}`);
                         }
                     }
                 });
             } else if (ts.isCallExpression(child.expression)) {
                  if (!(child.expression.expression.name && child.expression.expression.name.getText() === 'map')) {
                      const { line, character } = sourceFile.getLineAndCharacterOfPosition(child.getStart());
                      console.log(`[?] Call expression inside AnimatePresence: ${file}:${line+1}:${character+1}`);
                  }
             }
          } else if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
             const attributes = child.openingElement ? child.openingElement.attributes : child.attributes;
             const hasKey = attributes.properties.some(p => p.name && p.name.getText() === 'key');
             if (!hasKey) {
                 const { line, character } = sourceFile.getLineAndCharacterOfPosition(child.getStart());
                 console.log(`[!] Missing key on direct element child of AnimatePresence: ${file}:${line+1}:${character+1}`);
             }
          }
        });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(f => {
    let p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.tsx')) checkFile(p);
  });
}
walk('src');

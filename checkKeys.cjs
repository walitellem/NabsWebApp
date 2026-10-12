const fs = require("fs");
const path = require("path");

function walkDir(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(walkDir(full));
    } else if (full.endsWith(".tsx")) {
      results.push(full);
    }
  });
  return results;
}

const files = walkDir("./src");

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  
  lines.forEach((line, idx) => {
    if (line.includes("key=") || line.includes("key =")) {
      const match = line.match(/key\s*=\s*({[^}]+}|"[^"]+")/);
      if (match) {
        const keyExpr = match[1];
        if (keyExpr === "{i}" || keyExpr === "{idx}" || keyExpr === "{index}") {
          console.log(`[INDEX-ONLY KEY] ${path.basename(file)}:${idx + 1} -> ${keyExpr}`);
        } else if (!keyExpr.includes("idx") && !keyExpr.includes("index") && !keyExpr.includes("i") && !keyExpr.includes("wd") && keyExpr.startsWith("{")) {
          console.log(`[NO-INDEX KEY] ${path.basename(file)}:${idx + 1} -> ${keyExpr} in line: ${line.trim()}`);
        }
      }
    }
  });
});

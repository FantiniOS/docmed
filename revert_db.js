
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "src");

function revertInFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      revertInFiles(fullPath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      const original = content;
      
      // Revert Supabase table names
      content = content.replace(/from\(\s*["\x27]pacientes["\x27]\s*\)/g, "from(\"familiares\")");
      
      // Revert foreign key columns in eq() or updates
      content = content.replace(/["\x27]paciente_id["\x27]/g, "\"familiar_id\"");
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Reverted DB refs in: ${fullPath}`);
      }
    }
  }
}
revertInFiles(rootDir);
console.log("DB Revert complete.");


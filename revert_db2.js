
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
      
      // Revert variables holding DB columns
      content = content.replace(/paciente_id/g, "familiar_id");
      content = content.replace(/pacienteId/g, "familiarId");
      content = content.replace(/PacienteId/g, "FamiliarId");
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Reverted DB columns in: ${fullPath}`);
      }
    }
  }
}
revertInFiles(rootDir);
console.log("DB columns Revert complete.");


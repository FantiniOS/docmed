
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "src");

// 1. Rename directories
const dirsToRename = [
  { old: "src/app/familiares", new: "src/app/pacientes" },
  { old: "src/app/exames/familiar", new: "src/app/exames/paciente" },
  { old: "src/components/familiares", new: "src/components/pacientes" },
];

dirsToRename.forEach(dir => {
  const oldPath = path.join(__dirname, dir.old);
  const newPath = path.join(__dirname, dir.new);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed directory: ${oldPath} -> ${newPath}`);
  }
});

// 2. Rename files
function renameFilesInDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      renameFilesInDir(fullPath);
    } else {
      if (file.includes("familiar")) {
        const newFile = file.replace(/familiar/g, "paciente");
        const newFullPath = path.join(dirPath, newFile);
        fs.renameSync(fullPath, newFullPath);
        console.log(`Renamed file: ${fullPath} -> ${newFullPath}`);
      }
    }
  }
}
renameFilesInDir(rootDir);

// 3. Global Find & Replace in files
function replaceInFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInFiles(fullPath);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".json")) {
      let content = fs.readFileSync(fullPath, "utf-8");
      
      const original = content;
      
      // Strict replacements preserving case
      content = content.replace(/familiarId/g, "pacienteId");
      content = content.replace(/FamiliarId/g, "PacienteId");
      content = content.replace(/familiar_id/g, "paciente_id");
      content = content.replace(/Familiares/g, "Pacientes");
      content = content.replace(/familiares/g, "pacientes");
      content = content.replace(/Familiar/g, "Paciente");
      content = content.replace(/familiar/g, "paciente");
      content = content.replace(/FAMILIARES/g, "PACIENTES");
      content = content.replace(/FAMILIAR/g, "PACIENTE");

      if (content !== original) {
        fs.writeFileSync(fullPath, content, "utf-8");
        console.log(`Updated content in: ${fullPath}`);
      }
    }
  }
}
replaceInFiles(rootDir);

console.log("Refactoring complete.");


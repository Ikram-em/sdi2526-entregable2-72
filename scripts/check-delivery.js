const fs = require("fs");
const path = require("path");

const GROUP = "72";
const rootDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(process.cwd(), "..");

const expectedEntries = [
  `sdi2526-entrega2-${GROUP}.pdf`,
  `sdi2526-entrega2-${GROUP}.xlsx`,
  `sdi2526-entrega2-${GROUP}`,
  `sdi2526-entrega2-test-${GROUP}`
];

function describeEntry(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return "MISSING";
  }

  const stats = fs.statSync(targetPath);
  return stats.isDirectory() ? "DIR" : "FILE";
}

function main() {
  console.log(`Comprobando estructura de entrega en: ${rootDir}`);

  let hasErrors = false;

  for (const entry of expectedEntries) {
    const targetPath = path.join(rootDir, entry);
    const status = describeEntry(targetPath);
    const expectedType = entry.endsWith(".pdf") || entry.endsWith(".xlsx") ? "FILE" : "DIR";

    if (status !== expectedType) {
      hasErrors = true;
      console.log(`[ERROR] ${entry}: esperado ${expectedType}, encontrado ${status}`);
      continue;
    }

    console.log(`[OK] ${entry}`);
  }

  if (hasErrors) {
    console.log("Faltan elementos obligatorios o la estructura no coincide con la rúbrica.");
    process.exitCode = 1;
    return;
  }

  console.log("Estructura de entrega correcta.");
}

main();

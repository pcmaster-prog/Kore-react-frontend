/**
 * Genera public/firebase-messaging-sw.js a partir del template
 * reemplazando placeholders por variables de entorno.
 *
 * Se ejecuta como prebuild para no exponer credenciales en el repositorio.
 */
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js.template');
const outputPath = path.join(__dirname, '..', 'public', 'firebase-messaging-sw.js');

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`[generate-firebase-sw] Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

let template = fs.readFileSync(templatePath, 'utf-8');

requiredVars.forEach((key) => {
  const placeholder = `__${key}__`;
  const value = process.env[key];
  template = template.split(placeholder).join(value);
});

fs.writeFileSync(outputPath, template, 'utf-8');
console.log(`[generate-firebase-sw] Generated ${outputPath}`);

import fs from 'fs';
import path from 'path';

const filesToRefactor = [
  'src/features/nomina/NominaPage.tsx',
  'src/features/bitacora/BitacoraPage.tsx',
  'src/features/auth/LoginPage.tsx',
  'src/features/tasks/TaskCatalogPanel.tsx',
  'src/features/tasks/catalog/AssignRoutineModal.tsx',
  'src/features/tasks/catalog/AssignTaskModal.tsx', // if exists
  'src/features/dashboard/SupervisorDashboard.tsx' // might have AssignTaskModal inline
];

const replacements = [
  // 1. CARDS & PANELS
  { from: /\bbg-white\b/g, to: 'bg-k-bg-card' },
  { from: /\bborder-neutral-100\/50\b/g, to: 'border-k-border' },
  { from: /\bborder-neutral-100\b/g, to: 'border-k-border' },
  { from: /\bborder-neutral-200\b/g, to: 'border-k-border' },
  { from: /\bbg-neutral-50\/30\b/g, to: 'bg-k-bg-card2' },
  { from: /\bbg-neutral-50\b/g, to: 'bg-k-bg-card2' },
  { from: /\bshadow-sm\b/g, to: 'shadow-k-card' },

  // 2. TEXT COLORS FOR CARDS
  { from: /\btext-obsidian\b/g, to: 'text-k-text-h' },
  { from: /\btext-neutral-500\b/g, to: 'text-k-text-b' },
  { from: /\btext-neutral-400\b/g, to: 'text-k-text-b' },
  { from: /\btext-neutral-300\b/g, to: 'text-k-text-b' },

  // 3. SIDEBAR / LARGE HEADERS
  { from: /\bbg-obsidian\b/g, to: 'bg-k-bg-sidebar' },

  // 4. PRIMARY BUTTONS
  { from: /bg-k-bg-sidebar([ \w-]*)text-white([ \w-]*)hover:bg-gold/g, to: 'bg-k-accent-btn$1text-k-accent-btn-text$2hover:opacity-90' },
  { from: /bg-k-bg-sidebar([ \w-]*)text-white([ \w-]*)hover:bg-neutral-800/g, to: 'bg-k-accent-btn$1text-k-accent-btn-text$2hover:opacity-90' },
  { from: /bg-k-bg-sidebar([ \w-]*)text-white([ \w-]*)hover:opacity-90/g, to: 'bg-k-accent-btn$1text-k-accent-btn-text$2hover:opacity-90' },
  { from: /hover:bg-neutral-800/g, to: 'hover:opacity-90' },
  { from: /hover:bg-gold/g, to: 'hover:opacity-90' },
];

for (const file of filesToRefactor) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    for (const { from, to } of replacements) {
      content = content.replace(from, to);
    }
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Refactored ${file}`);
  } else {
    console.log(`Skipped ${file} - not found`);
  }
}

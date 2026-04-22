import fs from 'fs';
import path from 'path';

const filesToRefactor = [
  'src/features/dashboard/ManagerDashboard.tsx',
  'src/features/dashboard/EmployeeDashboard.tsx',
  'src/features/dashboard/SupervisorDashboard.tsx',
  'src/features/attendance/ManagerAttendancePage.tsx',
  'src/features/attendance/EmployeeAttendancePage.tsx',
  'src/features/employees/EmpleadosPage.tsx',
  'src/features/tasks/TareasManagerPage.tsx',
  'src/features/tasks/EmployeeTasksPage.tsx',
  'src/features/configuracion/ConfiguracionPage.tsx',
  'src/features/gondolas/GondolaRellenoPage.tsx',
  'src/features/nomina/NominaPage.tsx',
  'src/features/bitacora/BitacoraPage.tsx',
  'src/features/auth/LoginPage.tsx',
];

for (const file of filesToRefactor) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/\bborder-neutral-50\b/g, 'border-k-border');
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed borders in ${file}`);
  }
}

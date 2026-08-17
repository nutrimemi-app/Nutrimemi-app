const { execSync } = require('child_process');

try {
  console.log(execSync('git add .').toString());
  console.log(execSync('git commit -m "fix: resolver dependencias de Vercel (font) y forzar version visible v4.0.0"').toString());
  console.log(execSync('git push origin main').toString());
} catch (err) {
  console.error("ERROR:");
  console.error(err.message);
  if (err.stdout) console.error(err.stdout.toString());
  if (err.stderr) console.error(err.stderr.toString());
}

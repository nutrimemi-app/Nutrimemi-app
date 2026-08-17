const { execSync } = require('child_process');
const fs = require('fs');

try {
  const gitLog = execSync('git log -1 --format="%H %ci"').toString();
  const gitStatus = execSync('git status').toString();
  fs.writeFileSync('git_info.txt', `GIT LOG:\n${gitLog}\n\nGIT STATUS:\n${gitStatus}`);
  
  try {
    const vercelLs = execSync('npx vercel ls').toString();
    fs.appendFileSync('git_info.txt', `\n\nVERCEL LS:\n${vercelLs}`);
  } catch (err) {
    fs.appendFileSync('git_info.txt', `\n\nVERCEL LS ERROR:\n${err.message}`);
  }
} catch (err) {
  fs.writeFileSync('git_info.txt', `ERROR:\n${err.message}`);
}

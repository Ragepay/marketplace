// add + commit + push en un solo paso, con tu mensaje.
//   npm run push -- "tu mensaje de commit"
// Si no pasás mensaje, usa "update".
import { execSync } from "node:child_process";

const msg = process.argv[2] || "update";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

run("git add -A");
run(`git commit -m ${JSON.stringify(msg)}`); // JSON.stringify = comillas seguras
run("git push -u origin HEAD");

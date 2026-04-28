import { cpSync, existsSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const dist = "dist";
const publishBranch = "main";
const worktree = ".deploy-pages";

if (!existsSync(dist)) {
  throw new Error("dist does not exist. Run npm run build first.");
}

try {
  execFileSync("git", ["worktree", "remove", worktree, "--force"], {
    stdio: "ignore"
  });
} catch {
  // The worktree may not exist on a clean checkout.
}
execFileSync("git", ["worktree", "prune"], {
  stdio: "inherit"
});
rmSync(worktree, { recursive: true, force: true });

execFileSync("git", ["fetch", "origin", publishBranch], {
  stdio: "inherit"
});
execFileSync("git", ["worktree", "add", "-B", publishBranch, worktree, `origin/${publishBranch}`], {
  stdio: "inherit"
});

for (const entry of readdirSync(worktree)) {
  if (entry !== ".git") {
    rmSync(`${worktree}/${entry}`, { recursive: true, force: true });
  }
}

for (const entry of readdirSync(dist)) {
  cpSync(`${dist}/${entry}`, `${worktree}/${entry}`, { recursive: true });
}

execFileSync("git", ["-C", worktree, "add", "."], { stdio: "inherit" });
try {
  execFileSync("git", ["-C", worktree, "commit", "-m", "Deploy static site"], {
    stdio: "inherit"
  });
} catch {
  console.log("No static site changes to deploy.");
}
execFileSync("git", ["-C", worktree, "push", "origin", publishBranch, "--force"], {
  stdio: "inherit"
});

execFileSync("git", ["worktree", "remove", worktree, "--force"], {
  stdio: "inherit"
});

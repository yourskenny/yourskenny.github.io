#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import { writeGeneratedContent } from "./content-from-folder-core.mjs";

const validTypes = new Set(["auto", "blog", "course", "project"]);

function printHelp() {
  console.log(`Usage: node scripts/content-from-folder.mjs <folder> [options]

Generate Astro content from a local folder.

Options:
  --type <auto|project|course|blog>  Override auto classification.
  --title <title>                    Override the generated title.
  --slug <slug>                      Override the output slug.
  --force                            Overwrite an existing generated file.
  --publish                          Commit, push source, and deploy static site.
  --no-verify                        Skip npm test and npm run build.
  --help                             Show this help.
`);
}

function parseArgs(argv) {
  const args = [...argv];
  const options = {
    force: false,
    publish: false,
    verify: true,
    type: undefined,
    title: undefined,
    slug: undefined
  };
  let folder;

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--publish") {
      options.publish = true;
      continue;
    }
    if (arg === "--no-verify") {
      options.verify = false;
      continue;
    }
    if (arg === "--type") {
      const value = args.shift();
      if (!validTypes.has(value)) {
        throw new Error(`Invalid --type value: ${value}`);
      }
      options.type = value === "auto" ? undefined : value;
      continue;
    }
    if (arg === "--title") {
      options.title = args.shift();
      continue;
    }
    if (arg === "--slug") {
      options.slug = args.shift();
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (folder) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
    folder = arg;
  }

  return { folder, options };
}

export function commandInvocationFor(command, args, options = {}) {
  const needsShell =
    process.platform === "win32" && /\.(cmd|bat)$/i.test(command);

  return needsShell
    ? { command: "cmd.exe", args: ["/d", "/s", "/c", command, ...args], options }
    : { command, args, options };
}

function run(command, args, options = {}) {
  const invocation = commandInvocationFor(command, args, { stdio: "inherit", ...options });
  execFileSync(invocation.command, invocation.args, invocation.options);
}

function read(command, args) {
  const invocation = commandInvocationFor(command, args, { encoding: "utf8" });
  return execFileSync(invocation.command, invocation.args, invocation.options).trim();
}

function verifySourceBranch() {
  const branch = read("git", ["branch", "--show-current"]);
  if (branch !== "source") {
    throw new Error(`Publishing must run from the source branch. Current branch: ${branch || "(detached)"}`);
  }
}

function verifySite() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  run(npmCommand, ["test"]);
  run(npmCommand, ["run", "build"]);
}

function publishGeneratedFile(result) {
  verifySourceBranch();
  run("git", ["add", "--", result.outputPath]);

  try {
    run("git", ["diff", "--cached", "--quiet"]);
    console.log("No source changes to commit.");
  } catch {
    run("git", ["commit", "-m", `Add ${result.slug} site content`]);
    run("git", ["push", "origin", "source"]);
  }

  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  run(npmCommand, ["run", "deploy"]);
}

function urlsFor(result) {
  const section = result.collection === "blog" ? "blog" : "projects";
  return {
    github: `https://yourskenny.github.io/${section}/${result.slug}/`,
    custom: `https://yourskenny.top/${section}/${result.slug}/`
  };
}

export function main(argv = process.argv.slice(2)) {
  const { folder, options } = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }
  if (!folder) {
    printHelp();
    throw new Error("Missing required folder argument.");
  }

  const result = writeGeneratedContent(resolve(folder), {
    type: options.type,
    title: options.title,
    slug: options.slug,
    force: options.force
  });

  console.log(`Generated ${result.type} content: ${result.outputPath}`);

  if (options.verify) {
    verifySite();
  }

  if (options.publish) {
    publishGeneratedFile(result);
  }

  const urls = urlsFor(result);
  console.log(`GitHub Pages URL: ${urls.github}`);
  console.log(`Custom domain URL: ${urls.custom}`);
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

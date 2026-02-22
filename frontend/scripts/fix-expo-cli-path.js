#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const expoDir = path.join(root, "node_modules", "expo");
const cliDir = path.join(root, "node_modules", "@expo", "cli");
const nestedCliDir = path.join(expoDir, "node_modules", "@expo", "cli");
const nestedMetroRequire = path.join(
  nestedCliDir,
  "build",
  "metro-require",
  "require.js"
);

function ensureExpoCliNestedPath() {
  if (!fs.existsSync(expoDir) || !fs.existsSync(cliDir)) {
    return;
  }

  if (fs.existsSync(nestedMetroRequire)) {
    return;
  }

  fs.mkdirSync(path.dirname(nestedCliDir), { recursive: true });
  try {
    const relativeTarget = path.relative(path.dirname(nestedCliDir), cliDir);
    fs.symlinkSync(relativeTarget, nestedCliDir, "dir");
  } catch {
    // Fallback for filesystems where symlink may be blocked.
    fs.cpSync(cliDir, nestedCliDir, { recursive: true });
  }
}

ensureExpoCliNestedPath();

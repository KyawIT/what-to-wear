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
const shareIntentPluginChecker = path.join(
  root,
  "node_modules",
  "expo-share-intent",
  "plugin",
  "build",
  "withCompatibilityChecker.js"
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

function patchExpoShareIntentCompatibility() {
  if (!fs.existsSync(shareIntentPluginChecker)) {
    return;
  }

  const sourceCheck =
    'if (!config.sdkVersion?.includes(package_json_1.default.peerDependencies.expo.replace("^", ""))) {';
  const patchedCheck =
    'if (!(config.sdkVersion?.startsWith("54.") || config.sdkVersion?.includes(package_json_1.default.peerDependencies.expo.replace("^", "")))) {';

  const checker = fs.readFileSync(shareIntentPluginChecker, "utf8");
  if (!checker.includes(sourceCheck) || checker.includes(patchedCheck)) {
    return;
  }

  fs.writeFileSync(
    shareIntentPluginChecker,
    checker.replace(sourceCheck, patchedCheck),
    "utf8"
  );
}

ensureExpoCliNestedPath();
patchExpoShareIntentCompatibility();

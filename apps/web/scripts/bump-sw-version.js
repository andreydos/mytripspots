#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "../public/sw.js");

// Generate version bump based on timestamp
const timestamp = Math.floor(Date.now() / 1000);
const runtimeVersion = `"mytripspots-runtime-v${timestamp}"`;
const documentVersion = `"mytripspots-document-v${timestamp}"`;

let content = fs.readFileSync(swPath, "utf-8");

// Replace version strings
content = content.replace(
  /const RUNTIME_CACHE = "mytripspots-runtime-v\d+";/,
  `const RUNTIME_CACHE = ${runtimeVersion};`
);

content = content.replace(
  /const DOCUMENT_CACHE = "mytripspots-document-v\d+";/,
  `const DOCUMENT_CACHE = ${documentVersion};`
);

fs.writeFileSync(swPath, content);

console.log(`✓ Service worker cache versions updated to timestamp ${timestamp}`);

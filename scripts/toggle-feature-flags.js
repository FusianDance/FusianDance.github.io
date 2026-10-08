#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const featureFlags = [
  {
    key: "audition",
    navTitle: "Audition",
    appRoute: "/audition",
  },
];

/**
 * Get the feature flags from environment variables
 */
function getFeatureFlags() {
  // read all env vars that start with FEATURE_ and return the key
  return Object.keys(process.env)
    .filter((key) => key.startsWith("FEATURE_") && process.env[key] === "true")
    .map((key) => key.replace("FEATURE_", "").toLowerCase());
}

/**
 * Remove disabled feature routes from the static export (out/)
 */
function removeDisabledRoutes(disabledFeatures) {
  const outDir = path.join(__dirname, "../out");
  for (const feature of disabledFeatures) {
    for (const dir of [feature.appRoute, `_next/static/chunks/app${feature.appRoute}`]) {
      fs.rmSync(path.join(outDir, dir), { recursive: true, force: true });
    }
    console.log(`🚫 Removed disabled route from build: ${feature.appRoute}`);
  }
}

function writeEnabledFeatures(enabledFeatures) {
  const outputPath = path.join(__dirname, "../src/config/nav-items.generated.ts");

  // Ensure the config directory exists
  const configDir = path.dirname(outputPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Generate TypeScript file content
  const navItems = JSON.stringify(
    enabledFeatures.map((feature) => {
      return {
        navTitle: feature.navTitle,
        appRoute: feature.appRoute,
      };
    }),
    null,
    2
  );

  // This file is auto-generated. Do not edit manually.
  const content = `// This file is auto-generated. Do not edit manually.
export const additionalNavItems = ${navItems};
`;
  fs.writeFileSync(outputPath, content, "utf8");
}

function toggleFeatureFlags() {
  const envFlags = getFeatureFlags();

  writeEnabledFeatures(featureFlags.filter((feature) => envFlags.includes(feature.key)));
}

function removeDisabledFeatures() {
  const envFlags = getFeatureFlags();

  removeDisabledRoutes(featureFlags.filter((feature) => !envFlags.includes(feature.key)));
}

// Run if executed directly: prebuild generates nav items, `--postbuild` strips disabled routes from out/
if (require.main === module) {
  if (process.argv.includes("--postbuild")) {
    removeDisabledFeatures();
  } else {
    toggleFeatureFlags();
  }
}

module.exports = { toggleFeatureFlags, removeDisabledFeatures };

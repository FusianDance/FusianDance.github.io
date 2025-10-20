#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const featureFlags = [
  {
    key: "audition",
    navTitle: "Audition",
    appRoute: "/audition",
    dirPaths: ["src/app/audition/**/*"],
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

function writeIgnoredPaths(disabledFeatures) {
  const ignoredPaths = disabledFeatures.flatMap((feature) => {
    return feature.dirPaths;
  });

  const outputPath = path.join(__dirname, "../ignored-build-paths.json");
  fs.writeFileSync(outputPath, JSON.stringify(ignoredPaths, null, 2), "utf8");
}

function writeEnabledFeatures(enabledFeatures) {
  const outputPath = path.join(__dirname, "../src/config/nav-items.generated.json");

  // Ensure the config directory exists
  const configDir = path.dirname(outputPath);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Generate TypeScript file content
  const content = JSON.stringify(
    enabledFeatures.map((feature) => {
      return {
        navTitle: feature.navTitle,
        appRoute: feature.appRoute,
      };
    }),
    null,
    2
  );

  fs.writeFileSync(outputPath, content, "utf8");
}

function toggleFeatureFlags() {
  const envFlags = getFeatureFlags();

  writeEnabledFeatures(featureFlags.filter((feature) => envFlags.includes(feature.key)));

  writeIgnoredPaths(featureFlags.filter((feature) => !envFlags.includes(feature.key)));
}

// Run if executed directly
if (require.main === module) {
  toggleFeatureFlags();
}

module.exports = { toggleFeatureFlags };

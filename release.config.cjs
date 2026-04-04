/**
 * semantic-release: Version + CHANGELOG aus konventionellen Commits (feat/fix/BREAKING etc.).
 * Erster Release: optional aktuellen Stand mit `git tag v0.1.0` markieren, sonst wertet SR die Historie aus.
 * @see https://semantic-release.gitbook.io/
 */
/** @type {import('semantic-release').GlobalConfig} */
module.exports = {
  branches: ["main", "master"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/exec",
      {
        prepareCmd:
          "node scripts/set-release-version.mjs ${nextRelease.version} && node scripts/sync-version.mjs && npm install --package-lock-only --ignore-scripts --prefix web && npm install --package-lock-only --ignore-scripts --prefix server && npm install --package-lock-only --ignore-scripts"
      }
    ],
    [
      "@semantic-release/git",
      {
        assets: [
          "CHANGELOG.md",
          "package.json",
          "package-lock.json",
          "web/package.json",
          "web/package-lock.json",
          "server/package.json",
          "server/package-lock.json"
        ],
        message: "chore(release): ${nextRelease.version}"
      }
    ],
    "@semantic-release/github"
  ]
};

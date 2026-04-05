/**
 * semantic-release: Version + CHANGELOG aus konventionellen Commits (feat/fix/BREAKING etc.).
 *
 * Letzte Version kommt aus Git-Tags (tagFormat v${version}), nicht aus package.json. Ohne erkannten
 * letzten Tag setzt semantic-release die nächste Version fest auf 1.0.0 (Konstante FIRST_RELEASE).
 * Bestehende 0.x-Linie: höchsten Stand auf dem Default-Branch (main/master) taggen, z. B.
 * `git tag v0.38.2 <sha> && git push origin v0.38.2`. Ohne solchen Tag bleibt die nächste Version 1.0.0.
 *
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
          "node scripts/set-release-version.mjs ${nextRelease.version} && node scripts/sync-version.mjs && npm install --package-lock-only --ignore-scripts --prefix web && npm install --package-lock-only --ignore-scripts --prefix server && npm install --package-lock-only --ignore-scripts && git add CHANGELOG.md package.json package-lock.json web/package.json web/package-lock.json server/package.json server/package-lock.json && git commit -m \"chore(release): ${nextRelease.version}\"",
        publishCmd: "node scripts/release-pr.mjs ${nextRelease.version}"
      }
    ],
    "@semantic-release/github"
  ]
};

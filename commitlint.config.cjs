module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    (message) => /^Merge /.test(message),
    (message) => /^Revert /.test(message),
    (message) => /^Bump /.test(message)
  ]
};

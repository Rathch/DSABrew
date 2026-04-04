/** @see https://commitlint.js.org/reference/rules.html — u. a. header-max-length: 100 (Default bei config-conventional) */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  ignores: [
    (message) => /^Merge /.test(message),
    (message) => /^Revert /.test(message),
    (message) => /^Bump /.test(message)
  ]
};

// Updater do commit-and-tag-version (ver .versionrc.json) pro campo
// expo.version em app.config.js — é JS, não JSON, então o updater padrão
// não serve; isso casa e substitui só o primeiro `version: "..."`.
const VERSION_REGEX = /version:\s*"([^"]+)"/;

module.exports.readVersion = function readVersion(contents) {
  const match = contents.match(VERSION_REGEX);
  return match ? match[1] : null;
};

module.exports.writeVersion = function writeVersion(contents, version) {
  return contents.replace(VERSION_REGEX, `version: "${version}"`);
};

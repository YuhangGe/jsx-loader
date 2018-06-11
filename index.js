const transform = require('./src/transform');

module.exports = function(content, map, meta) {
  return transform(content);
}
const transform = require('./src/transform');
const path = require('path');

module.exports = function(content) {
  const output = transform(content);
  if (output.error) {
    throw output.error;
  }

  if (output.map) {
    const resourcePath = this.resourcePath;
    output.map.version = 3;
    output.map.file = resourcePath;
    output.map.sources = [
      path.relative(process.cwd(), resourcePath)
    ];
    output.map.sourcesContent = [content];
    output.map.sourceRoot = process.cwd();  
  }
 
  if (this.cacheable) this.cacheable();
	this.callback(null, output.code, output.map);
}
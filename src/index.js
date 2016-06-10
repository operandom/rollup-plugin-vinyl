var hypothetical = require('rollup-plugin-hypothetical');


/**
 * Create a rollup plugin to pass Vinyl file to rollup.
 *
 * @param {Object|Array<Object>} files A vinyl file
 */
function RollupPluginVinyl(files) {

  if (!Array.isArray(files)) {
    files = [files];
  }


  /** @type {Object} */
  var wonderland = {};

  files.forEach(function(file) {
    if (!file.isBuffer()) {
      throw Error('Content of file "' + file.path + '" is not a buffer.');
    }
    wonderland[file.path] = file.contents.toString();
  });


  return hypothetical({
    files: wonderland,
    allowRealFiles: true
  });

}


module.exports = RollupPluginVinyl;

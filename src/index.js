var path = require('path');


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
  var paths = {};

  files.forEach(function(file) {
    paths[RollupPluginVinyl.unix(file.path)] = file;
  }, this);


  return {

    files: Array.isArray(files) ? files : [files],

    /**
     * @param {string} importee Import's id.
     * @param {string} importer Tmporter's id.
     * @return {string|null|undefined|false} id The resolved id.
     */
    resolveId: function (importee, importer) {

      var id = null;

      if (paths[importee]) {
        id = importee;
      } else {
        id = RollupPluginVinyl.unix(path.resolve(
          path.dirname(importer),
          importee
        ));
      }

      return id;
    },

    /**
     * @param {string} id The id to load.
     * @return {string} The file content
     */
    load: function (id) {
      return paths[id] ? paths[id].contents.toString() : null;
    }

  };

}


/**
 * Transform native path to Unix path style.
 *
 * @param {string} value A path.
 * @param {string?} sep A custom separator
 * @return {string} a unix style path;
 */
RollupPluginVinyl.unix = function unix(value, sep) {
  return value.split(sep || path.sep).join('/');
};


module.exports = RollupPluginVinyl;
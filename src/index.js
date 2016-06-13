var path = require('path');


/**
 * Create a rollup plugin to pass Vinyl file to rollup.
 *
 * @param {Object|Array<Object>} files A vinyl file
 * @return {{ resolveId: Function, load: Function }} The plugin object
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

    /**
     * Resolve import id.
     *
     * @param {string} importee Import's id.
     * @param {string} importer Importer's id.
     * @return {string|null|undefined|false} id The resolved id.
     */
    resolveId: function (importee, importer) {

      var id = null;

      if (paths[importee]) {
        id = importee;
      } else {

        var resolved = RollupPluginVinyl.unix(path.resolve(
          path.dirname(importer),
          importee
        ));

        if (paths[resolved]) {
          id = resolved;
        }
      }

      return id;
    },

    /**
     * Load content for a given id.
     *
     * @param {string} id The id to load.
     * @return {string} The file content
     */
    load: function (id) {

      if (id == null) {
        return id;
      }

      id = RollupPluginVinyl.unix(id);

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
RollupPluginVinyl.unix = function unix(value) {
  return value.split(path.sep).join('/');
};


module.exports = RollupPluginVinyl;
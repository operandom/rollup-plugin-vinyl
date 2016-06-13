var path = require('path');

/** @type {string} The name of the plugin */
var PLUGIN_NAME = 'Vinyl plugin';

/** @type {string} The version of the plugin */
var VERSION = require('../package.json').version;

/** @type {string} The template used to generate errors for unsupported stream contents */
var TEMPLATE_ERROR_STREAM = '[' + PLUGIN_NAME + '] %s > Stream contents are not supported';

/** @type {string} The template used to generate errors for unsupported null contents */
var TEMPLATE_ERROR_NULL   = '[' + PLUGIN_NAME + '] %s > Content can not be null';

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

    if (file.isNull()) {
      throw new Error(TEMPLATE_ERROR_NULL.replace('%s', file.path));
    }

    if (file.isStream()) {
      throw new Error(TEMPLATE_ERROR_STREAM.replace('%s', file.path));
    }

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

RollupPluginVinyl.NAME = PLUGIN_NAME;
RollupPluginVinyl.VERSION = VERSION;

RollupPluginVinyl.TEMPLATE_ERROR_STREAM = TEMPLATE_ERROR_STREAM;
RollupPluginVinyl.TEMPLATE_ERROR_NULL   = TEMPLATE_ERROR_NULL;

module.exports = RollupPluginVinyl;
var path = require('path');

/** @type {string} The name of the plugin */
var PLUGIN_NAME = 'Vinyl plugin';

/** @type {string} The version of the plugin */
var VERSION = require('../package.json').version;

/** @type {string} The template used to generate errors for unsupported stream contents */
var TEMPLATE_ERROR_STREAM = '[' + PLUGIN_NAME + '] Stream contents are not supported (%s)';

/** @type {string} The template used to generate errors for unsupported null contents */
var TEMPLATE_ERROR_NULL   = '[' + PLUGIN_NAME + '] Content can not be null (%s)';


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
      throw new Error(RollupPluginVinyl.TEMPLATE_ERROR_NULL.replace('%s', file.path));
    }

    if (file.isStream()) {
      throw new Error(RollupPluginVinyl.TEMPLATE_ERROR_STREAM.replace('%s', file.path));
    }

    paths[unix(file.path)] = file;
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

      var id = getIdOrNull(paths, resolve(importee));

      if (importer) {

        id = id || getIdOrNull(
          paths,
          resolve(path.dirname(importer || '.'), importee)
        );

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

      id = unix(id);

      return paths[id] ? paths[id].contents.toString() : null;
    }

  };

}


Object.defineProperties(RollupPluginVinyl, {

  NAME: {
    enumerable: true,
    value: PLUGIN_NAME
  },

  VERSION: {
    enumerable: true,
    value: VERSION
  },

  TEMPLATE_ERROR_NULL: {
    enumerable: true,
    writable: true,
    value: TEMPLATE_ERROR_NULL
  },

  TEMPLATE_ERROR_STREAM: {
    enumerable: true,
    writable: true,
    value: TEMPLATE_ERROR_STREAM
  },

  _unix: {
    writable: true,
    value: unix
  },

  _getIdOrNull: {
    writable: true,
    value: getIdOrNull
  },

  _resolve: {
    writable: true,
    value: resolve
  }

});


module.exports = RollupPluginVinyl;


/* TOOLS */

/**
 * Find id for a key given in object.
 *
 * @param {Object} o A ids dictionnary
 * @param {string} key a key to resolve
 * @returns {string|null} The matching id or null.
 */
function getIdOrNull(o, key) {

  var id;

  return o[id = key] ? id :
         o[id = key + '.js'] ? id :
         o[id = key + '/index.js'] ? id :
         null;
}


/**
 * Transform native path to Unix path style.
 *
 * @param {string} value A path.
 * @param {string?} sep A custom separator
 * @return {string} a unix style path;
 */
function unix(value) {
  return value.split(path.sep).join('/');
}


/**
 * Resolve to an absolute unix style path.
 *
 * @param {...string} value A path
 * @return {string} A cleaned absolute path
 */
function resolve(value) {
  return unix(path.resolve.apply(path, arguments));
}


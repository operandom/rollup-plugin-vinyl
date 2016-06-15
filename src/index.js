var path = require('path');

/** @type {string} The name of the plugin */
var PLUGIN_NAME = 'Vinyl plugin';

/** @type {string} The version of the plugin */
var VERSION = require('../package.json').version;

var TEMPLATE_BASE = '[' + PLUGIN_NAME + '] ';

/** @type {string} The template used to generate errors for unsupported stream contents */
var TEMPLATE_ERROR_STREAM = TEMPLATE_BASE + 'Stream contents are not supported (%s)';

/** @type {string} The template used to generate errors for unsupported null contents */
var TEMPLATE_ERROR_NULL   = TEMPLATE_BASE + 'Content can not be null (%s)';

/** @type {string} The template used to generate errors for missing options object */
var TEMPLATE_ERROR_OPTIONS = TEMPLATE_BASE + 'Options must be object (%s given)';

/** @type {string} The template used to generate errors for missing files parameters*/
var TEMPLATE_ERROR_OPTIONS_FILES = TEMPLATE_BASE + 'Options must have at least a files property';


/**
 * Create a rollup plugin to pass Vinyl file to rollup.
 *
 * @param {{ plugins: (Object|Array<Object>), extension: string }} options Must have at least a `files` property
 * @return {{ resolveId: Function, load: Function }} The plugin object
 */
function RollupPluginVinyl(options) {

  if (typeof options !== 'object') {
    throw createError(RollupPluginVinyl.TEMPLATE_ERROR_OPTIONS, [options]);
  }

  if (!options.files) {
    throw createError(RollupPluginVinyl.TEMPLATE_ERROR_OPTIONS_FILES,[options]);
  }

  options.files = [].concat(options.files);

  /** @type {Object<Object>} */
  var dictionary = {};

  options.files.forEach(function(file) {

    if (file.isNull()) {
      throw new Error(RollupPluginVinyl.TEMPLATE_ERROR_NULL.replace('%s', [file.path]));
    }

    if (file.isStream()) {
      throw new Error(RollupPluginVinyl.TEMPLATE_ERROR_STREAM.replace('%s', [file.path]));
    }

    dictionary[unix(file.path)] = file;

  }, this);


  var o = {

    /**
     * Resolve import id.
     *
     * @param {string} importee Import's id.
     * @param {string} importer Importer's id.
     * @return {string|null} id The resolved id.
     */
    resolveId: function (importee, importer) {

      var id = getIdOrNull(dictionary, resolve(importee), options.extension);

      if (importer) {

        id = id || getIdOrNull(
          dictionary,
          resolve(path.dirname(importer || '.'), importee),
          options.extension
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

      return dictionary[id] ? dictionary[id].contents.toString() : null;
    }

  };


  Object.defineProperties(o, {
    _options: {
      get: function() {
        return options;
      },
      set: function(value) {
        options = value;
      }
    }
  });

  return o;

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

  TEMPLATE_ERROR_OPTIONS: {
    enumerable: true,
    writable: true,
    value: TEMPLATE_ERROR_OPTIONS
  },

  TEMPLATE_ERROR_OPTIONS_FILES: {
    enumerable: true,
    writable: true,
    value: TEMPLATE_ERROR_OPTIONS_FILES
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
  },

  _createError: {
    writable: true,
    value: createError
  }

});


module.exports = RollupPluginVinyl;


/* TOOLS */

/**
 * Find id for a key given in object.
 *
 * @param {Object} o An ids dictionnary
 * @param {string} key A key to resolve
 * @param {string} ext A custom extension
 * @returns {string|null} The matching id or null.
 */
function getIdOrNull(o, key, ext) {

  var id;

  ext = ext || 'js';

  return o[id = key] ? id :
         o[id = key + '.' + ext] ? id :
         o[id = key + '/index.' + ext] ? id :
         null;
}


/**
 * Transform native path to Unix path style.
 *
 * @param {string} value A path.
 * @return {string} a unix style path.
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


/**
 * Create a new Error from template.
 *
 * @param {string} template A string which the `%s` will be replaced by parameters
 * @param {string|Array<string>} parameters A value or array of values to inject in the template
 * @return {Error} A new error generated with the template and parameters given
 */
function createError(template, parameters) {

  parameters.forEach(function(parameter) {
    template = template.replace('%s', parameter);
  });

  return new Error(template);

}


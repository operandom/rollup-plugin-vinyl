rollup-plugin-vinyl
===================

[![Build Status](https://travis-ci.org/operandom/rollup-plugin-vinyl.svg)](https://travis-ci.org/operandom/rollup-plugin-vinyl) [![Dependecies status](https://david-dm.org/operandom/rollup-plugin-vinyl.svg)](https://david-dm.org/username/repo.svg)

A [rollup.js](http://rollupjs.org) plugin to import from [Vinyl](https://github.com/gulpjs/vinyl) files.

installation
------------

```Shell
npm i -D rollup-plugin-vinyl
```


Usage
-----

```javascript
import files from 'rollup-plugin-vinyl';

export default {
  entry: 'src/main.js',
  format: 'cjs',
  plugins: [
      // single file
      files(vinylFile),
      // multiple files
      files([vinylFile1, vinylFile2, ...]);
  ],
  dest: 'bundle.js'
}
```

Test
----
```Shell
git clone https://github.com/operandom/rollup-plugin-vinyl.git
cd rollup-plugin-vinyl
npm install
npm test
```

License
-------

Released under the [MIT license](LICENSE.md).

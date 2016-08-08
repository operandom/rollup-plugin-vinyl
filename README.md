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
import vinyl from 'rollup-plugin-vinyl';
import File from 'vinyl';

export default {
  entry: 'src/main.js',
  format: 'cjs',
  plugins: [

      // Single file
      vinyl({ files: new File({ ... }) }),

      // Multiple files
      vinyl({ files: [
          vinylFile1,
          vinylFile2,
          ...
      ] }),

      // Custom module resolution
      // This will resolve `import Module from 'lib/module'`
      // to `lib/module.ts` or `lib/module/index.ts`
      vinyl({
        extension: 'ts',
        files: ...
      })

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

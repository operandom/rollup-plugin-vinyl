import fs from 'fs';
import { Readable } from 'stream';
import path from 'path';
import test from 'ava';
import { rollup } from 'rollup';
import File from 'vinyl';
import vinyl from '../';
import { linter } from 'eslint';



/* ESLINT */


test('Should not make eslint errors.', t => {

  return Promise.all([
    getFileContent('../.eslintrc.json'),
    getFileContent('../src/index.js')
  ])
  .then(files => {

    var config = files[0];
    var file = files[1];

    var errors = linter.verify(
      file.contents.toString(),
      JSON.parse(config.contents.toString()),
      file.stem + '.' + file.extname
    );

    if (errors.length === 0) {
      t.pass();
      return;
    }

    errors.forEach(error => {
      error = getFormatedError(error);
      console.log('[ESLint] ' + error);
      t.fail(error);
    });
  });

});



/* OPTIONS */


test('Should throw the good error on missing options object.', t => {

  var error = t.throws(() => {
    vinyl();
  });

  var expected = vinyl._createError(
    vinyl.TEMPLATE_ERROR_OPTIONS,
    [undefined]
  );

  t.true(error.message === expected.message);

});


test('Should throw the good error on missing required files option.', t => {

  var error = t.throws(() => {
    vinyl({});
  });

  var expected = vinyl._createError(
    vinyl.TEMPLATE_ERROR_OPTIONS_FILES,
    []
  );

  t.true(error.message === expected.message);

});


test('Should give access to options object', t => {

  var options = { files:  new File({
    path: path.resolve('unused.js'),
    contents: new Buffer('unused')
  })};

  t.deepEqual(vinyl(options)._options, options);

});



/* VINYL FILES */


test('Accept Vinyl as parameter, resolve his id and load his contents.', t => {

  var file = new File({
    path: path.resolve('src/fake.js'),
    contents: new Buffer('fake')
  });

  var unixPath = vinyl._unix(file.path);

  var plugin = vinyl({ files: file });
  var id = plugin.resolveId(unixPath);

  t.true(id === unixPath);
  t.true(plugin.load(id) === file.contents.toString());

});


test('Accept array as parameters, resolve ids, load contents and resolve relative import', t => {

  var fake1 = new File({
    base: path.resolve('src'),
    path: path.resolve('src/fake.js'),
    contents: new Buffer('fake1')
  });
  var unixPath1 = vinyl._unix(fake1.path);

  var fake2 = new File({
    base: path.resolve('src'),
    path: path.resolve('src/lib/import.js'),
    contents: new Buffer('fake2')
  });
  var unixPath2 = vinyl._unix(fake2.path);

  var plugin = vinyl({ files: [fake1, fake2] });
  var id1 = plugin.resolveId(unixPath1);
  var id2 = plugin.resolveId(unixPath2);

  t.true(plugin.resolveId(id1) === unixPath1);
  t.true(plugin.load(id1) === fake1.contents.toString());
  t.true(plugin.resolveId(id2) === unixPath2);
  t.true(plugin.load(id2) === fake2.contents.toString());


  var relativeId = plugin.resolveId(vinyl._unix(fake2.relative), id1);

  t.true(relativeId === vinyl._unix(fake2.path));
  t.true(plugin.load(relativeId) === fake2.contents.toString());


});


test('Should import from non-vinyl file', t => {

  var fake = new File({
    base: path.resolve('src'),
    path: path.resolve('src/lib/fake.js'),
    contents: new Buffer('fake')
  });

  var plugin = vinyl({ files: fake });

  var filePath = path.resolve('src/main.js');

  var id = plugin.resolveId(fake.relative, filePath);

  t.true(id === vinyl._unix(fake.path));

});


test('Should not resolve and not load unknow ids', t => {

  var fake = new File({
    base: path.resolve('src'),
    path: path.resolve('src/lib/fake.js'),
    contents: new Buffer('fake')
  });

  var plugin = vinyl({ files: fake });

  var filePath = path.resolve('src/main.js');
  var wrongId = 'src/lib/fail.js';

  var id = plugin.resolveId(wrongId, filePath);

  t.false(id === vinyl._unix(fake.path));
  t.true(null === plugin.load(wrongId));

});



/* ROLLUP */


test('should handle an entry point', t => {

  return rollup({
    entry: 'entry.js',
    plugins: [
      vinyl({ files :[
        new File({
          path: path.resolve('./entry.js'),
          contents: new Buffer('import Fake from \'lib/Fake.js\'; console.log(Fake)')
        }),
        new File({
          path: path.resolve('./lib/Fake.js'),
          contents: new Buffer('export default "I\'m a fake !"')
        })
      ] })
    ]
  })
  .then((bundle) => {
    t.true(bundle.generate().code === 'var Fake = "I\'m a fake !"\n\nconsole.log(Fake)');
  });

});



test('should load knew ids from other plugins', t => {

  return rollup({
    entry: 'lib/entry.js',
    plugins: [
      vinyl({ files: [
        new File({
          path: path.resolve('lib/entry.js'),
          contents: new Buffer('import a from "b"; console.log(a);')
        }),
        new File({
          path: path.resolve('lib/a.js'),
          contents: new Buffer('export default "a";')
        })
      ] }),
      {
        resolveId: id => id === 'b' ? path.resolve('lib/a.js') : undefined
      }

    ]
  })
  .then((bundle) => {
    t.true(bundle.generate().code === 'var a = "a";\n\nconsole.log(a);');
  });


});



/* CONTENTS */


test('should throw error on stream contents', t => {

  var fullpath = path.resolve('stream.js');

  var error = t.throws(() => {

    vinyl({ files: new File({
      path: fullpath,
      contents: new Readable()
    }) });

  });

  t.true(error.message === vinyl.TEMPLATE_ERROR_STREAM.replace('%s', fullpath));

});


test('should throw error on empty contents', t => {

  var fullpath = path.resolve('null.js');

  var error = t.throws(() => {

    vinyl({ files: new File({
      path: fullpath
    }) });

  });

  t.true(error.message === vinyl.TEMPLATE_ERROR_NULL.replace('%s', fullpath));

});



/* MODULES */


test('Should resolve id for module as file', t => {

  var modulepath = 'lib/module';
  var moduleFullpath = path.resolve(modulepath);
  var fullpath = path.resolve(moduleFullpath + '.js');

  var plugin = vinyl({ files: new File({
    path: fullpath,
    contents: new Buffer('module')
  }) });

  t.true(
    plugin.resolveId(vinyl._unix(moduleFullpath)) === vinyl._unix(fullpath)
  );

});


test('Should resolve id for module as folder', t => {

  var modulepath = 'lib/module';
  var moduleFullpath = path.resolve(modulepath);
  var fullpath = path.resolve(moduleFullpath + '/index.js');

  var entryFullpath = path.resolve('entry.js');

  var plugin = vinyl({ files: [
    new File({
      path: entryFullpath,
      contents: new Buffer(`import m from ${modulepath}`)
    }),
    new File({
      path: fullpath,
      contents: new Buffer('export default "module"')
    })
  ] });

  t.true(
    plugin.resolveId(vinyl._unix(moduleFullpath)) === vinyl._unix(fullpath),
    'Absolute path can not be resolved'
  );

  t.true(
    plugin.resolveId(
      'lib/module',
      vinyl._unix(entryFullpath)
    ) === vinyl._unix(fullpath),
    'Relative path can not be resolved'
  );
});


test('Should resolve id for module as folder with extension option is set', t => {

  var modulepath = 'lib/module';
  var moduleFullpath = path.resolve(modulepath);
  var fullpath = path.resolve(moduleFullpath + '/index.ts');

  var entryFullpath = path.resolve('entry.ts');

  var plugin = vinyl({
    extension: 'ts',
    files: [
      new File({
        path: entryFullpath,
        contents: new Buffer(`import m from ${modulepath}`)
      }),
      new File({
        path: fullpath,
        contents: new Buffer('export default "module"')
      })
    ]
  });

  t.true(
    plugin.resolveId(vinyl._unix(moduleFullpath)) === vinyl._unix(fullpath),
    'Absolute path can not be resolved'
  );

  t.true(
    plugin.resolveId(
      'lib/module',
      vinyl._unix(entryFullpath)
    ) === vinyl._unix(fullpath),
    'Relative path can not be resolved'
  );
});



/* TOOLS */



/**
 * Get a Vinyl file for a given file path.
 *
 * @param {string} filePath The file path
 * @return {Vinyl} A Vinyl file
 */
function getFileContent(filePath) {

  filePath = path.resolve(filePath);

  return new Promise((resolve, reject) => {

    fs.readFile(filePath, (error, data) => {

      if (error) {
        reject(error);
      } else {
        resolve(new File({
          path: filePath,
          contents: data
        }));
      }

    });

  });

}


/**
 * Formet ESLint error.
 *
 * @param {{ line: number, column: number, message: string }} error An ESLint error object
 * @return {string} A formated error
 */
function getFormatedError(error) {
  return error.line + ':' + error.column + ' ' + error.message;
}
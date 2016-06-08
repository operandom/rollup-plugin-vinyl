import path from 'path';
import test from 'ava';
import Vinyl from 'vinyl';
import Plugin from '../';


test('Accept Vinyl as parameter, resolve his id and load his contents.', t => {

  var file = new Vinyl({
    path: path.resolve('src/fake.js'),
    contents: new Buffer('fake')
  });

  var unixPath = Plugin.unix(file.path);

  var plugin = Plugin(file);
  var id = plugin.resolveId(unixPath);

  t.true(id === unixPath);
  t.true(plugin.load(id) === file.contents.toString());

});


test('Accept array as parameters, resolve ids, load contents and resolve relative import', t => {

  var fake1 = new Vinyl({
    base: path.resolve('src'),
    path: path.resolve('src/fake.js'),
    contents: new Buffer('fake1')
  });
  var unixPath1 = Plugin.unix(fake1.path);

  var fake2 = new Vinyl({
    base: path.resolve('src'),
    path: path.resolve('src/lib/import.js'),
    contents: new Buffer('fake2')
  });
  var unixPath2 = Plugin.unix(fake2.path);

  var plugin = Plugin([fake1, fake2]);
  var id1 = plugin.resolveId(unixPath1);
  var id2 = plugin.resolveId(unixPath2);

  t.true(plugin.resolveId(id1) === unixPath1);
  t.true(plugin.load(id1) === fake1.contents.toString());
  t.true(plugin.resolveId(id2) === unixPath2);
  t.true(plugin.load(id2) === fake2.contents.toString());


  var relativeId = plugin.resolveId(Plugin.unix(fake2.relative), id1);

  t.true(relativeId === Plugin.unix(fake2.path));
  t.true(plugin.load(relativeId) === fake2.contents.toString());


});


test('Should import from non-vinyl file', t => {

  var fake = new Vinyl({
    base: path.resolve('src'),
    path: path.resolve('src/lib/fake.js'),
    contents: new Buffer('fake')
  });

  var plugin = Plugin(fake);

  var filePath = path.resolve('src/main.js');

  var id = plugin.resolveId(fake.relative, filePath);

  t.true(id === Plugin.unix(fake.path));

});


test('Should not resolve id and not load on wrong import', t => {

  var fake = new Vinyl({
    base: path.resolve('src'),
    path: path.resolve('src/lib/fake.js'),
    contents: new Buffer('fake')
  });

  var plugin = Plugin(fake);

  var filePath = path.resolve('src/main.js');
  var wrongId  = 'src/lib/fail.js';

  var id = plugin.resolveId(wrongId, filePath);

  t.false(id === Plugin.unix(fake.path));
  t.true(null === plugin.load(wrongId));

});
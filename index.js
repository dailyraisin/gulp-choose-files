'use strict';

const PLUGIN_NAME = 'gulp-choose-files';
var PluginError = require('gulp-util').PluginError;
var through = require('through2');
var extend = require('extend-shallow');
var Prompt = require('prompt-checkbox');

module.exports = function(options) {
  var opts = extend({key: 'relative', save: false}, options);
  var msg = opts.message || 'Which files do you want to write?';
  var paths = [];
  var files = {};

  return through.obj(function transform (file, enc, next) {
    //var stream = this;

    if (file.isNull()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Null not supported.'));
      return next(null, file);
    }

    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));

      // or, if you can handle Streams:
      //file.contents = file.contents.pipe(...
      //return next(null, file);
    }
    else if (file.isBuffer()) {
      //this.emit('info', 'my file path=' + file.path);
    }

    if (opts.skip) {
      next(null, file);
      return;
    }

    var key = fileKey(file, opts);
    paths.push(key);
    files[key] = file;

    return next();
  }, function flush (next) {
    var stream = this;

    if (typeof opts.choices === 'string') {
      opts.choices = [opts.choices];
    }

    if (Array.isArray(opts.choices)) {
      opts.choices.forEach(function(filepath) {
        stream.push(files[filepath]);
      });
      next();
      return;
    }

    if (paths.length === 0) {
      next();
      return;
    }

    //next(null, file);
    //paths.forEach(function (filepath) {
    //  stream.push(filepath);
    //});

    var answers = {};
    //stream.emit('info', 'possible files' + JSON.stringify(files));

    var prompt = new Prompt({
      name: 'files',
      message: msg,
      type: 'checkbox',
      //choiceObject: true,
      radio: true,
      choices: paths
    });

    prompt.run(answers)
      .then(function(answers) {

        answers.forEach(function(filepath) {
          var myFile = files[filepath.name];
          //stream.emit('info', 'chosen filepath...' + myFile + JSON.stringify(filepath));
          if (myFile !== undefined) {
            stream.push(myFile);
          }
        });
        next();
      })
      .catch(next);


    /*prompt.run()
      .then(function resolution (answers) {
        //stream.emit('error', new PluginError(PLUGIN_NAME, 'hello choices'));

        answers.forEach(function (filepath) {
          stream.push(files[filepath]);
          stream.emit('info', 'I want to use=' + filepath);
        });
      }, function rejection (rejection) {
        stream.emit('error', new PluginError(PLUGIN_NAME, rejection));
        next(rejection);
      //  //return stream;
      }).catch(function (e) {

        stream.emit('error', new PluginError(PLUGIN_NAME, 'catch'));
        //next();

        //return stream;
      });*/
  });
};

function fileKey(file, opts) {
  if (typeof opts.key === 'string') {
    return file[opts.key];
  }
  if (typeof opts.key === 'function') {
    return opts.key(file);
  }
  return file.relative;
}

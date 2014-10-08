/*jslint node: true */
"use strict";
var util = require('util');


var defaultOptions = {
  extraArguments: false   // Allow arguments not in template
};


var argumentOptions = [
  'required',             // argument is required
  'defined',              // argument must be defined
  'default',              // default value when not passed
  'function',             // function to call with value for validation
  'requires',             // require another argument to be present
  'excludes'              // require another argument *not* to be present
];


function check(obj, template, opt, callback) {
  if (typeof opt === 'function') {
    callback = opt;
    opt = undefined;
  }
  if (opt === undefined) {
    opt = defaultOptions;
  }

  if (typeof obj !== 'object')
    throw new Error('obj must be an object');
  if (typeof template !== 'object')
    throw new Error('template must be an object');
  if (typeof callback !== 'function')
    throw new Error('callback must be a function');

  var checksPre = [];   // List of pre-checks
  var checksPost = [];  // List of post-checks
  var values = {};      // Values to return

  // Pre-checks per template item
  Object.keys(template).forEach( function processArgument(arg) {

    // Check valid template options for this argumnt
    Object.keys(template[arg]).forEach( function (templateOpt) {
      if (argumentOptions.indexOf(templateOpt) === -1) {
        var err = util.format( "%s: unknown template option: %s",
          arg, templateOpt
        );
        throw new Error(err);
      }
    });

    // Set initial value for option, can change later
    if (arg in obj) values[arg] = obj[arg];

    // Required
    if ('required' in template[arg]) {
      if (template[arg].required) checkAdd(checksPre, arg, checkRequired);
    }
    // Defined
    if (template[arg].defined) {
      checkAdd(checksPre, arg, checkDefined);
    }
    // Default
    if (template[arg].default) {
      checkAdd(checksPre, arg, checkDefault);
    }
    // Function
    if (template[arg].function) {
      checkAdd(checksPre, arg, checkFunction);
    }
    // Requires (post check)
    if (template[arg].requires) {
      checkAdd(checksPost, arg, checkRequires);
    }
    // Excludes (post check)
    if (template[arg].excludes) {
      checkAdd(checksPost, arg, checkExcludes);
    }
  });
  checksRun();


  function checkAdd(list, key, func) {
    list.push({key: key, func: func});
  }

  // Executes the validations for a list of tests
  function checksDo(listChecks, callback) {
    if (listChecks.length === 0) return callback(null);

    var check = listChecks.shift();
    check.func(check.key, function (err, v) {
      if (err) return callback(err);

      // do the next check
      setImmediate(checksDo, listChecks, callback);
    });
  }

  // Does pre-tests first, and post-tests after
  function checksRun() {
    checksDo(checksPre, function (err) {
      if (err) return checksDone(err);
      checksDo(checksPost, function (err) {
        return checksDone(err);
      });
    });
  }

  function checksDone(err) {
    if (err) return callback(err);
    return callback(null, values);
  }


  // Argument checks
  function checkRequired(k, cb) {
    if (k in obj)
      return cb(null);
    else
      return cb(k + ': argument missing');
  }

  function checkDefined(k, cb) {
    if (k in obj && obj[k] !== undefined)
      return cb(null);
    else
      return cb(k + ': argument missing or undefined');
  }

  function checkDefault(k, cb) {
    if (!(k in obj))
      values[k] = template[k].default;
    return cb(null);
  }

  function checkFunction(k, cb) {
    if (typeof template[k].function !== 'function')
      throw new Error(k + ': passed function is not a function');

    template[k].function(obj[k], function (err) {
      if (err) return cb(k + ": "+err);
      return cb(null);
    });
  }

  function checkRequires(k, cb) {
    if (!(template[k].requires instanceof Array))
      throw new Error(k + ': passed requires-list should be an array');

    template[k].requires.forEach( function (requiredKey) {
      if (!(requiredKey in obj))
        return cb(k + ": requires key '"+ requiredKey +"'");
    });
    return cb(null);
  }

  function checkExcludes(k, cb) {
    if (!(template[k].excludes instanceof Array))
      throw new Error(k + ': passed excludes-list should be an array');

    template[k].excludes.forEach( function (excludeKey) {
      if (excludeKey in obj)
        return cb(k + ": excludes key '"+ excludeKey +"'");
    });
    return cb(null);
  }

}


/*
  Exports
*/

exports.check = check;
exports.defaults = defaultOptions;

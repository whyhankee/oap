/*jslint node: true */
"use strict";
var util = require('util');

// Some template check code is skipped on production for
//  speed improvement
var isProduction = (process.env.NODE_ENV.match(/^prod/));

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


function check(obj, template, opt, done) {
  if (typeof opt === 'function') {
    done = opt;
    opt = undefined;
  }
  if (opt === undefined) {
    opt = defaultOptions;
  }

  var checksPre = [];   // List of pre-checks
  var checksPost = [];  // List of post-checks
  var values = {};      // Values to return
  var errors = {};

  // Argument type checking
  if (!isProduction) {
    if (typeof obj !== 'object')
      throw new Error('obj must be an object');
    if (typeof template !== 'object')
      throw new Error('template must be an object');
    if (typeof done !== 'function')
      throw new Error('done must be a function');
  }

  // Iterate over all the template arguments
  Object.keys(template).forEach( function processArgument(arg) {

    // Determine template checks for this argument
    Object.keys(template[arg]).forEach( function (templateOpt) {

      // Check template options for this arguments
      if (!isProduction) {

        // Unknow template option?
        if (argumentOptions.indexOf(templateOpt) === -1) {
          var err = util.format( "%s: unknown template option: %s",
            arg, templateOpt
          );
          throw new Error(err);
        }

        // Template arguments - function
        if (template[arg].function && typeof template[arg].function !== 'function') {
          throw new Error(arg + ': passed function is not a function');
        }
        // Template arguments - requires
        if (template[arg].requires && !(template[arg].requires instanceof Array)) {
          throw new Error(arg + ': passed requires-list should be an array');
        }
        // Template arguments - excludes
        if (template[arg].excludes && !(template[arg].excludes instanceof Array)) {
          throw new Error(arg + ': passed excludes-list should be an array');
        }
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

  /**
   * Argument checking flow
   */
  function checkAdd(list, key, func) {
    list.push({key: key, func: func});
  }

  checksDo(checksPre, function (err) {
    if (err) return checksDone();
    checksDo(checksPost, function (err) {
      return checksDone();
    });
  });
  function checksDone() {
    if (Object.keys(errors).length) return done(errors);
    return done(null, values);
  }

  function checksDo(listChecks, cb) {
    if (listChecks.length === 0) {
      return cb(Object.keys(errors).length);
    }

    var check = listChecks.shift();
    check.func(check.key, function (errObject, v) {
      // On error, push the error to the error-stack and
      //  return cb() with an indication that an error occured
      if (errObject) {
        var argName = Object.keys(errObject)[0];

        if (!errors[argName]) errors[argName] = [];
        errors[argName].push(errObject[argName]);
      }

      // schedule the next check
      setImmediate(checksDo, listChecks, cb);
    });
  }

  /**
   * The argument checking functions
   */
  function checkRequired(k, cb) {
    if (k in obj)
      return cb(null);
    else
      return cb(buildError(k, 'argument missing'));
  }

  function checkDefined(k, cb) {
    if (k in obj && obj[k] !== undefined)
      return cb(null);
    else
      return cb(buildError(k, 'argument missing or undefined'));
  }

  function checkDefault(k, cb) {
    if (!(k in obj))
      values[k] = template[k].default;
    return cb(null);
  }

  function checkFunction(k, cb) {
    template[k].function(obj[k], function (err) {
      if (err) return cb(buildError(k, err));
      return cb(null);
    });
  }

  function checkRequires(k, cb) {
    template[k].requires.forEach( function (requiredKey) {
      if (!(requiredKey in obj))
        return cb(buildError(k, "requires key '" +requiredKey+ "'"));
    });
    return cb(null);
  }

  function checkExcludes(k, cb) {
    template[k].excludes.forEach( function (excludeKey) {
      if (excludeKey in obj)
        return cb(buildError(k, "excludes key '"+ excludeKey +"'"));
    });
    return cb(null);
  }

  // Builds an error object the checks can return
  function buildError(k, message) {
    var errObj = {};
    errObj[k] = message;
    return errObj;
  }
}


/*
  Exports
*/

exports.check = check;
exports.defaults = defaultOptions;

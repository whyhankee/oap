'use strict';
var util = require('util');


// Some template check code is skipped on production for
//  speed improvement
var isProduction = (process.env.NODE_ENV.match(/^prod/));

var defaultOptions = {
  extraArguments: true   // Allow arguments not in template
};


var argumentOptions = [
  'required',             // argument is required
  'defined',              // argument must be defined
  'default',              // default value when not passed
  'function',             // function to call with value for validation
  'requires',             // require another argument to be present
  'excludes'              // require another argument *not* to be present
];


function check(args, template, opt, done) {
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
    if (typeof args !== 'object')
      throw new Error('args must be an object');
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
      //    Skip in production (for speed)
      if (!isProduction) {

        // Unknown template option?
        if (argumentOptions.indexOf(templateOpt) === -1) {
          var err = util.format( '%s: unknown template option: %s',
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
    if (arg in args) values[arg] = args[arg];

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

  /**
   * Start the checks
   */
  checksDo(checksPre, function (err) {
    if (err) return checksDone();

    checksDo(checksPost, function (/*err*/) {
      return checksDone();
    });
  });

  function checksDone() {
    if (Object.keys(errors).length) return done(errors);
    return done(null, values);
  }

  /**
   * Do all the checks in the list
   */
  function checksDo(listChecks, cb) {
    if (listChecks.length === 0) {
      return cb();
    }

    var check = listChecks.shift();
    check.func(check.key, function () {
      // schedule the next check
      setImmediate(checksDo, listChecks, cb);
    });
  }

  /**
   * The argument checking functions
   */
  function checkRequired(k, cb) {
    if (k in args)
      return cb(null);
    else
      return cb(buildError(k, 'argument missing'));
  }

  function checkDefined(k, cb) {
    if (k in args && args[k] !== undefined)
      return cb(null);
    else
      return cb(buildError(k, 'argument missing or undefined'));
  }

  function checkDefault(k, cb) {
    if (!(k in args)) {
      values[k] = template[k].default;
    }
    return cb(null);
  }

  function checkFunction(k, cb) {
    template[k].function(args[k], function (err) {
      if (err) return cb(buildError(k, err));
      return cb(null);
    });
  }

  function checkRequires(k, cb) {
    template[k].requires.forEach( function (requiredKey) {
      if (!(requiredKey in args)) buildError(k, 'requires key \'' +requiredKey+ '\'');
    });
    return cb(null);
  }

  function checkExcludes(k, cb) {
    template[k].excludes.forEach( function (excludeKey) {
      if (excludeKey in args) buildError(k, 'excludes key \''+ excludeKey +'\'');
    });
    return cb(null);
  }

  // Add's error to the errors object;
  //
  function buildError(k, message) {
    if (!Array.isArray(errors[k])) errors[k] = [];
    errors[k].push(message);
  }
}


/*
  Exports
*/
exports.check = check;
exports.defaults = defaultOptions;

# OAP - Object Argument Parser

This module can be used in in situations where object are used as arguments.


Syntax is loosely based on Perl's Params::Check


# Install

    npm install oap


# Feature Example

    var oap = require('oap');

    var template = {
      arg1: {
        required: true,
        defined: true,
        default: 'a',
        function: testFunction,
        requires: ['arg2']
        excludes: ['arg3']
      },
      arg2: {
        required: false,
        requires: ['arg1']
      }
    };
    oap.check(template, args, function(err, result) {
      if (err) return cb('Argument parsing failed'+err);
      doAmazingStuff(args);
    });


# Template options

The options can be passed to the template

* required: Value must be present
* defined: Value cannot be undefined
* default: Default value if not passed
* function: Custom value to pass the value to
* requires: This value requires one or more other values to be passed as well
* excludes: This value requires one or more other values *not* to be present


# TODO

* oneOf: check if value is in array

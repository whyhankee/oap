# OAP - Object Argument Parser

This module can be used in situations where Objects are used to pass arguments.

The main goal of this module is to provide a easy method for validating the *existence* of arguments (values) in an Object. For value validation check other modules like [validator](https://www.npmjs.com/package/validator "Validator").

Syntax is loosely based on Perl's Params::Check


## Production Disclaimer

ready: No!

It's pretty new. Tests say it works but it could use some experience.
Also see `todo`


# What it does

* You define a template object with the rules for your arguments
* You pass the template and your object with arguments to `oap.check()`
* Oap will test you template arguments (unless NODE_ENV matches /^prod/)
* Oap will test your arguments against the template.
* Oap will try to run as many tests as it can and give you a complete error list for all the arguments. This is not always possible since tests are done in stages but ..


# Install

    npm install oap


# Example

    var oap = require('oap');


    function doSomeThing(args, cb) {
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

      oap.check(args, template, function(err, result) {
        if (err) return cb(err);
        doAmazingStuff(args);
      });

      function doAmazingStuff(args) {
        ...
      }
    }


# Template options

The options can be passed to the template

* `required` Value must be present
* `defined` Value cannot be undefined
* `default` Default value if not passed
* `function` Custom value to pass the value to
* `requires` This value requires one or more other values to be passed as well
* `excludes` This value requires one or more other values *not* to be present


# TODO (somewhat in order)

## Important
* Make browser compatible
* Measure and look for speed improvements

## Features
* oneOf template option: check if value is in array
* integrate with [validator](https://www.npmjs.com/package/validator "Validator") for value validation

## Bonus
* split-up the check() function
* Replace testrunner (tap -> mocha)

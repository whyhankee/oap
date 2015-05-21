/*jshint node: true */
"use strict";
var test = require('tap').test;
var oap = require('../oap.js');


test('default options', testDefaults);
test('invocation', testInvocation);
test('required', testRequired);
test('defined', testDefined);
test('default', testDefault);
test('requires', testRequires);
test('excludes', testExcludes);
test('function', testFunction);


function testDefaults (t) {
  t.deepEqual(
    oap.defaults,
    {extraArguments: true},
    'valid default options'
  );
  t.end();
}


function testInvocation (t) {
  // calling check
  t.throws(
    function () {
      oap.check();
    },
    new Error('obj must be an object')
  );

  t.throws(
    function () {
      oap.check({});
    },
    new Error('template must be an object')
  );

  t.throws(
    function () {
      oap.check({}, {});
    },
    new Error('done must be a function')
  );

  // calling check with an unknown template option
  t.throws(
    function() {
      oap.check({}, {a: {'__required__': true}}, function() {});
    },
    new Error('a: unknown template option: __required__')
  );

  t.end();
}



function testRequired (t) {
  var template = {
    a: {required: true}
  };

  t.test('required valid', requiredValid);
  t.test('required invalid', requiredInvalid);

  function requiredValid (t) {
    oap.check({a: 'a'}, template, function (err, args) {
      t.equal(err, null, 'no error');
      t.deepEqual(args, {a: 'a'}, 'valid result');
      t.end();
    });
  }

  function requiredInvalid (t) {
    oap.check({b: 'a'}, template, function (err, args) {
      t.deepEqual(err, {a: ['argument missing']}, 'valid error');
      t.equal(args, undefined, 'undefined return value');
      t.end();
    });
  }
}


function testDefined (t) {
  var template = {
    a: {defined: true}
  };

  t.test('defined valid', definedValid);
  t.test('defined invalid', definedInvalid);

  function definedValid (t) {
    oap.check({a: 'a'}, template, function (err, args) {
      t.equal(err, null, 'no error');
      t.deepEqual(args, {a: 'a'}, 'valid result');
      t.end();
    });
  }

  function definedInvalid (t) {
    oap.check({a: undefined}, template, function (err, args) {
      t.deepEqual(err, {a: ['argument missing or undefined']}, 'valid error');
      t.equal(args, undefined, 'undefined return value');
      t.end();
    });
  }
}


function testDefault (t) {
  var template = {
    a: {default: 'a'},
    b: {default: 'b'}
  };

  oap.check({a: 'aa'}, template, function (err, args) {
    t.equal(err, null, 'no error');
    t.deepEqual(args, {a: 'aa', b: 'b'}, 'valid arguments');
    t.end();
  });
}


function testFunction (t) {
  var template = {
    a: {function: testingFunction}
  };

  function testingFunction(v, cb) {
    if (v === 'goodValue') return cb(null);
    return cb('invalid value, not goodValue');
  }

  t.test('function valid', functionValid);
  t.test('function invalid', functionInvalid);
  t.test('function invalid invocation', functionInvalidInvocation);

  function functionValid (t) {
    oap.check({a: 'goodValue'}, template, function (err, args) {
      t.equal(err, null, 'no error');
      t.deepEqual(args, {a: 'goodValue'}, 'valid arguments');
      t.end();
    });
  }

  function functionInvalid (t) {
    oap.check({a: 'b'}, template, function (err, args) {
      t.deepEqual(err, {a: ['invalid value, not goodValue']}, 'valid error');
      t.equal(args, undefined, 'undefined return value');
      t.end();
    });
  }

  function functionInvalidInvocation (t) {
    var invalidTemplate = {
      a: {function: 'not_function'}
    };

    t.throws(
      function() {
        oap.check({a: 'a'}, invalidTemplate, function () {});
      },
      new Error('a: passed function is not a function')
    );
    t.end();
  }

}

function testRequires (t) {
  var template = {
    'a': {requires: ['b']},
    'b': {required: false}
  };

  t.test('requires valid', requiresValid);
  t.test('requires invalid', requiresInvalid);
  t.test('requires invalid invocation', requiresInvalidInvocation);

  function requiresValid (t) {
    oap.check({a: 'a', b: 'b'}, template, function (err, args) {
      t.equal(err, null, 'no error');
      t.deepEqual(args, {a: 'a', b: 'b'}, 'no error');
      t.end();
    });
  }

  function requiresInvalid (t) {
    oap.check({a: 'a'}, template, function (err, args) {
      var expectedErr = "requires key 'b'";
      t.deepEqual(err, {a: [expectedErr]}, 'valid error');
      t.equal(args, undefined, 'undefined return value');
      t.end();
    });
  }

  function requiresInvalidInvocation (t) {
    var invalidTemplate = {
      a: {requires: 'not_a_list'}
    };

    t.throws(
      function () {
        oap.check({a: 'a'}, invalidTemplate, function() {});
      },
      new Error('a: passed requires-list should be an array')
    );
    t.end();
  }
}


function testExcludes (t) {
  var template = {
    'a': {excludes: ['b']},
    'b': {required: false}
  };

  t.test('excludes valid', excludesValid);
  t.test('excludes invalid', excludesInvalid);
  t.test('excludes invalid invocation', excludesInvalidInvocation);

  function excludesValid (t) {
    oap.check({a: 'a'}, template, function (err, args) {
      t.equal(err, null, 'no error');
      t.deepEqual(args, {a: 'a'}, 'no error');
      t.end();
    });
  }

  function excludesInvalid (t) {
    oap.check({a: 'a', b: 'b'}, template, function (err, args) {
      var expectedErr = "excludes key 'b'";
      t.deepEqual(err, {a: [expectedErr]}, 'valid error');
      t.equal(args, undefined, 'undefined return value');
      t.end();
    });
  }

  function excludesInvalidInvocation (t) {
    var invalidTemplate = {
      a: {excludes: 'not_a_list'}
    };

    t.throws(
      function () {
        oap.check({a: 'a'}, invalidTemplate, function() {});
      },
      new Error('a: passed excludes-list should be an array')
    );
    t.end();
  }
}



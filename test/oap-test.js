/* eslint-env mocha */
var expect = require('expect.js');

var oap = require('../oap.js');


describe('Default options', testDefaults);
describe('Invocation', testInvocation);
describe('Validate - required', testRequired);
describe('Validate - defined', testDefined);
describe('Validate - default', testDefault);
describe('Validate - requires', testRequires);
describe('Validate - excludes', testExcludes);
describe('Validate - function', testFunction);


function testDefaults() {
  var expectedDefaults = {
    extraArguments: true
  };
  it('Has proper defaults', function () {
    expect(oap.defaults).to.eql(expectedDefaults);
  });
}


function testInvocation() {
  it('No arguments passed', function () {
    function callINoArgs() {
      oap.check();
    }
    expect(callINoArgs).to.throwException(/args must be an object/);
  });

  it('No template passed', function () {
    function callNoTemplate() {
      oap.check({});
    }
    expect(callNoTemplate).to.throwException(/template must be an object/);
  });

  it('No done function passed', function () {
    function callNoDone() {
      oap.check({}, {});
    }
    expect(callNoDone).to.throwException(/done must be a function/);
  });

  it('Invaid template-option passed', function () {
    function callInvalidOption() {
      oap.check({}, {a: {'__invalid__': true}}, function() {});
    }
    expect(callInvalidOption).to.throwException(/a: unknown template option: __invalid__/);
  });
}



function testRequired () {
  var template = {
    a: {required: true}
  };

  it('Valid', function (done) {
    oap.check({a: 'a'}, template, function (err, args) {
      expect(err).to.be(null);
      expect(args).to.eql({a: 'a'});
      return done();
    });
  });

  it('Invalid', function (done) {
    oap.check({b: 'a'}, template, function (err, args) {
      expect(err).to.eql({a: ['argument missing']}, 'valid error');
      expect(args).to.be(undefined);
      return done();
    });
  });
}


function testDefined () {
  var template = {
    a: {defined: true}
  };

  it('Valid', function (done) {
    oap.check({a: 'a'}, template, function (err, args) {
      expect(err).to.eql(null);
      expect(args).to.eql({a: 'a'});
      return done();
    });
  });

  it('Invalid', function (done) {
    oap.check({a: undefined}, template, function (err, args) {
      expect(err).to.eql({a: ['argument missing or undefined']});
      expect(args).to.be(undefined);
      return done();
    });
  });
}


function testDefault () {
  var template = {
    a: {default: 'a'},
    b: {default: 'b'}
  };

  it('Apply defaults', function (done) {
    oap.check({a: 'aa'}, template, function (err, args) {
      expect(err).to.be(null);
      expect(args).to.eql({a: 'aa', b: 'b'});
      return done();
    });
  });
}


function testRequires () {
  var template = {
    'a': {requires: ['b']},
    'b': {required: false}
  };

  it('Valid', function (done) {
    oap.check({a: 'a', b: 'b'}, template, function (err, args) {
      expect(err).to.be(null);
      expect(args).to.eql({a: 'a', b: 'b'});
      return done();
    });
  });

  it('Invalid', function (done) {
    var expectedErr = 'requires key \'b\'';

    oap.check({a: 'a'}, template, function (err, args) {
      expect(err).to.eql({a: [expectedErr]});
      expect(args).to.be(undefined);
      return done();
    });
  });

  it('Invalid invocation', function () {
    var invalidTemplate = {
      a: {requires: 'not_a_list'}
    };

    function callInvalidInvocation() {
      oap.check({a: 'a'}, invalidTemplate, function() {});
    }
    expect(callInvalidInvocation).to.throwException(/a: passed requires-list should be an array/);
  });
}


function testExcludes() {
  var template = {
    'a': {excludes: ['b']},
    'b': {required: false}
  };

  it('Valid', function (done) {
    oap.check({a: 'a'}, template, function (err, args) {
      expect(err).to.be(null);
      expect(args).to.eql({a: 'a'});
      return done();
    });
  });

  it('Invalid', function (done) {
    var expectedErr = 'excludes key \'b\'';

    oap.check({a: 'a', b: 'b'}, template, function (err, args) {
      expect(err).to.eql({a: [expectedErr]});
      expect(args).to.be(undefined);
      return done();
    });
  });

  it('Invalid invocation', function () {
    var invalidTemplate = {
      a: {excludes: 'not_a_list'}
    };

    function callInvalidInvocation() {
      oap.check({a: 'a'}, invalidTemplate, function() {});
    }
    expect(callInvalidInvocation).to.throwException(/a: passed excludes-list should be an array/);
  });
}


function testFunction () {
  var template = {
    a: {function: testingFunction}
  };

  function testingFunction(v, cb) {
    if (v === 'goodValue') return cb(null);
    return cb('invalid value, not goodValue');
  }

  it('Valid', function (done) {
    oap.check({a: 'goodValue'}, template, function (err, args) {
      expect(err).to.be(null);
      expect(args).to.eql({a: 'goodValue'});
      return done();
    });
  });

  it('Invalid', function (done) {
    oap.check({a: 'b'}, template, function (err, args) {
      expect(err).to.eql({a: ['invalid value, not goodValue']});
      expect(args).to.be(undefined);
      return done();
    });
  });

  it('Invalid invocation', function () {
    var invalidTemplate = {
      a: {function: 'not_function'}
    };

    function callInvalidInvocation() {
      oap.check({a: 'a'}, invalidTemplate, function() {});
    }
    expect(callInvalidInvocation).to.throwException(/a: passed function is not a function/);
  });
}

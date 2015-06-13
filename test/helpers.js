'use strict';

beforeEach(function() {
  jasmine.addMatchers({
    toHaveClass: function(util, customEqualityTesters) {
      return {
        compare: function(actual, expected) {
          var passed = actual.hasClass( expected );
          return {
            pass: passed,
            message: 'Expected ' + actual + (passed ? '' : ' not') + ' to equal ' + expected
          };
        }
      };
    }
  });
});

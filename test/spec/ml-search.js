/* global describe, beforeEach, module, it, expect, inject */

'use strict';

var $filter;

describe('ml.search#filters', function () {

  beforeEach(module('ml.search'));

  beforeEach(inject(function ($injector) {
    $filter = $injector.get('$filter');
  }));

  it('should truncate input', function() {
    expect( $filter('truncate')('hi this is joe..') ).toEqual( 'hi this...' );
  });

  it('should truncate input to length', function() {
    expect( $filter('truncate')('hi this is joe..', 15) ).toEqual( 'hi this is j...' );
  });

  it('should truncate input to length with custom end', function() {
    expect( $filter('truncate')('hi this is joe..', 15, '!') ).toEqual( 'hi this is joe!' );
  });

  it('should not truncate where input.length === length', function() {
    expect( $filter('truncate')('hi this is joe.', 15, '!') ).toEqual( 'hi this is joe.' );
  });

  it('should convert object to array of children', function() {
    var obj = {
      key1: { value: 1 },
      key2: { value: 2 },
      key3: { value: 3 },
      key4: { value: 4 }
    };
    var converted = $filter('object2Array')(obj);

    expect( _.isArray(converted) ).toEqual(true);
    expect( converted.length ).toEqual(4);
    expect( converted[0].value ).toEqual(1);
    expect( converted[0].__key ).toEqual('key1');
  });
});

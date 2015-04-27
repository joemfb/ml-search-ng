/* global describe, beforeEach, module, it, expect, inject */

describe('MLRemoteInput', function () {
  'use strict';

  var remoteInput;

  beforeEach(module('ml.search'));

  beforeEach(inject(function ($injector) {
    remoteInput = $injector.get('MLRemoteInputService');
  }));

  it('service to be injectable without ngRoute', function() {
    expect(remoteInput).toBeDefined;
  });

  it('callbacks to be called', function() {
    var counter = 0,
        latest = null,
        unsubscribe = null;

    unsubscribe = remoteInput.subscribe(function(input) {
      latest = input;
      counter++;
    });

    remoteInput.setInput('a');
    expect(counter).toEqual(1);
    expect(latest).toEqual('a');

    remoteInput.setInput('b');
    expect(counter).toEqual(2);
    expect(latest).toEqual('b');

    unsubscribe();

    remoteInput.setInput('c');
    expect(counter).toEqual(2);
    expect(latest).toEqual('b');
  });
});

/* global describe, beforeEach, module, it, expect, inject */
'use strict';

var elem, $scope, $compile, $rootScope, $q, remoteInput;

var mockLocation = { path: jasmine.createSpy('path') };
var mockSearchContext = {
  suggest: jasmine.createSpy('suggest').andCallFake(function() {
    return $q.defer().promise;
  })
};
var mockSearchFactory = {
  newContext: function() {
    return mockSearchContext;
  }
};

describe('ml-remote-input', function () {

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(module(function($provide) {
    $provide.value('$location', mockLocation);
  }));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');
    remoteInput = $injector.get('MLRemoteInputService');

    $scope = $rootScope.$new();

    elem = angular.element('<ml-remote-input search-ctrl="MySearchCtrl"></ml-remote-input>');

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should contain template', function() {
    expect(elem.find('.ml-search').length).toEqual(1);
    expect(elem.find('.ml-search > div.form-group').length).toEqual(1);
  });

  it('should display qtext', function() {
    var result;
    remoteInput.subscribe(function(input) {
      result = input;
    });
    remoteInput.setInput('hi');
    $scope.$apply();

    expect(result).toEqual('hi');
    expect( elem.find('input')[0].value ).toEqual('hi');
  });

  it('should run a search', function() {
    elem.find('button').eq(0).click();
    expect( mockLocation.path ).toHaveBeenCalled();
  });

});

describe('ml-remote-input#fa', function () {

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();

    elem = angular.element('<ml-remote-input search-ctrl="MySearchCtrl" template="fa"></ml-remote-input>');;

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should contain template', function() {
    expect(elem.find('.ml-search').length).toEqual(1);
    expect(elem.find('.ml-search > div.input-group').length).toEqual(1);
  });

});

describe('ml-remote-input#custom-template', function () {

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(module(function($provide) {
    $provide.value('$location', mockLocation);
    $provide.value('MLSearchFactory', mockSearchFactory);
  }));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');
    $q = $injector.get('$q');
    remoteInput = $injector.get('MLRemoteInputService');

    $templateCache = $injector.get('$templateCache');

    $templateCache.put(
      '/my-template.html',
      '<div class="custom-search" ng-click="suggest({ val: \'hi\' })"></div>'
    );

    $scope = $rootScope.$new();

    elem = angular.element('<ml-remote-input search-ctrl="MySearchCtrl" template="/my-template.html"></ml-remote-input>');

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should contain template', function() {
    expect(elem.find('.custom-search').length).toEqual(1);
  });

  it('should trigger suggest', function() {
    elem.find('.custom-search').eq(0).click();
    expect(mockSearchContext.suggest).toHaveBeenCalled();

    var args = mockSearchContext.suggest.mostRecentCall.args;
    expect( args[0] ).toEqual('hi');
  });

});

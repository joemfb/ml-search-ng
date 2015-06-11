/* global describe, beforeEach, module, it, expect, inject, jasmine */

describe('ml-remote-input', function () {
  'use strict';

  var elem, $scope, $compile, $rootScope, $q, remoteInput, $templateCache;

  var mockLocation, mockSearchContext;

  var mockSearchFactory = {
    newContext: function() {
      return mockSearchContext;
    }
  };

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));
  beforeEach(module('ngRoute'));

  beforeEach(function() {
    mockLocation = { path: jasmine.createSpy('path') };
    mockSearchContext = {
      suggest: jasmine.createSpy('suggest').andCallFake(function() {
        var d = $q.defer();
        d.resolve(arguments);
        return d.promise;
      })
    };
  });

  beforeEach(module(function($provide) {
    $provide.value('$location', mockLocation);
    $provide.value('MLSearchFactory', mockSearchFactory);
    $provide.value('$route', { routes: {
      '/': {
        templateUrl: '/views/search/search.html',
        controller: 'SearchCtrl',
        controllerAs: 'ctrl',
        originalPath: '/'
      },
      '/search': {
        templateUrl: '/views/search/search.html',
        controller: 'SearchCtrl',
        controllerAs: 'ctrl',
        originalPath: '/search'
      },
      '/mysearch': {
        templateUrl: '/views/search/search.html',
        controller: 'MySearchCtrl',
        controllerAs: 'ctrl',
        originalPath: '/mysearch'
      }
    }});
  }));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');
    $q = $injector.get('$q');
    remoteInput = $injector.get('MLRemoteInputService');

    $scope = $rootScope.$new();
  }));

  describe('#defaults', function () {

    beforeEach(function() {
      elem = angular.element('<ml-remote-input search-ctrl="MySearchCtrl"></ml-remote-input>');
      $compile(elem)($scope);
      $scope.$digest();
    });

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

    it('should get suggestions', function() {
      var result;
      elem.isolateScope().suggest('hi').then(function(response) { result = response; });
      $scope.$apply();
      expect( result.length ).toEqual(0);
    });

  });

  describe('#fa', function () {

    beforeEach(function() {
      elem = angular.element('<ml-remote-input search-ctrl="MySearchCtrl" template="fa"></ml-remote-input>');
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should contain template', function() {
      expect(elem.find('.ml-search').length).toEqual(1);
      expect(elem.find('.ml-search > div.input-group').length).toEqual(1);
    });

  });

  describe('#custom-template', function () {

    beforeEach(inject(function($injector) {
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

  describe('#multiple-controllers', function () {

    beforeEach(function() {
      $scope.ctrl = null;
      elem = angular.element('<ml-remote-input search-ctrl="{{ ctrl }}"></ml-remote-input>');
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should watch searchCtrl', function() {
      expect( mockLocation.path ).not.toHaveBeenCalled();
      $scope.ctrl = 'MySearchCtrl';
      $scope.$apply();

      expect( mockLocation.path ).toHaveBeenCalled();
    });

  });

});

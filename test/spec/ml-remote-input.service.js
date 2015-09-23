/* global describe, beforeEach, module, it, expect, inject */

describe('MLRemoteInput', function () {
  'use strict';

  var remoteInput, searchFactory, $q, $httpBackend, $rootScope;

  beforeEach(module('ml.search'));

  describe('#defaults', function () {

    beforeEach(inject(function ($injector) {
      remoteInput = $injector.get('MLRemoteInputService');
    }));

    it('should be injectable without ngRoute', function() {
      expect(remoteInput).toBeDefined();
      expect(remoteInput.routeAvailable).toEqual(false);
    });

    it('should invoke callbacks', function() {
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

    it('should fail to get path', function() {
      // TODO: fix this to make more sense
      expect( remoteInput.getPath('SearchCtrl') ).toBeNull;
    });

  });

  describe('#with-empty-ngRoute', function () {

    beforeEach(module('ngRoute'));

    beforeEach(inject(function ($injector) {
      remoteInput = $injector.get('MLRemoteInputService');
    }));

    it('should be injectable with ngRoute', function() {
      expect(remoteInput).toBeDefined();
      expect(remoteInput.routeAvailable).toEqual(true);
    });

    it('should get path', function() {
      // TODO: fix this to make more sense
      expect( remoteInput.getPath('SearchCtrl') ).toEqual('/');
    });

  });

  describe('#with-configured-ngRoute', function () {

    beforeEach(module('ngRoute'));

    beforeEach(module(function($provide) {
      $provide.value('$route', { routes: {
        '/': {
          templateUrl: '/views/home/home.html',
          controller: 'HomeCtrl',
          controllerAs: 'ctrl',
          originalPath: '/'
        },
        '/search': {
          templateUrl: '/views/search/search.html',
          controller: 'SearchCtrl',
          controllerAs: 'ctrl',
          originalPath: '/search'
        }
      }});
    }));

    beforeEach(inject(function ($injector) {
      remoteInput = $injector.get('MLRemoteInputService');
    }));

    it('should get path', function() {
      expect( remoteInput.getPath('SearchCtrl') ).toEqual('/search');
    });

  });

  describe('#with-multiple-routes', function () {

    beforeEach(module('ngRoute'));

    beforeEach(module(function($provide) {
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
        }
      }});
    }));

    beforeEach(inject(function ($injector) {
      remoteInput = $injector.get('MLRemoteInputService');
    }));

    it('should get path', function() {
      expect( remoteInput.getPath('SearchCtrl') ).toEqual('/');
    });

  });

  describe('#init-ctrl', function () {

    beforeEach(inject(function ($injector) {
      $q = $injector.get('$q');
      $httpBackend = $injector.get('$httpBackend');
      // $location = $injector.get('$location');
      $rootScope = $injector.get('$rootScope');

      searchFactory = $injector.get('MLSearchFactory', $q, $httpBackend);
      remoteInput = $injector.get('MLRemoteInputService');
    }));

    it('should init ctrl', function() {
      var $scope = $rootScope.$new();
      var model = { qtext: '' };
      var mlSearch = searchFactory.newContext();

      var counter = 0;

      remoteInput.initCtrl($scope, model, mlSearch, function() {
        counter++;
      });

      remoteInput.setInput('blah');
      expect(counter).toEqual(1);
    });

    it('should preserve ctrl state', function() {
      var $scope = $rootScope.$new();
      var model = { qtext: 'already here' };
      var mlSearch = searchFactory.newContext();

      remoteInput.initCtrl($scope, model, mlSearch, null);

      expect(remoteInput.input).toEqual('already here');
    });

  });

});

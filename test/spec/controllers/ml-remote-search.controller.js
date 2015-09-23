/* global describe, beforeEach, module, it, expect, inject, jasmine, MLSearchController, MLRemoteSearchController */

describe('MLRemoteSearchController', function () {
  'use strict';

  var ctrl, $location, $rootScope, $q, remoteInput, mockSearchContext;

  var asyncResolveMock = function() {
    var d = $q.defer();
    d.resolve.call(null, arguments);
    return d.promise;
  };

  var asyncRejectMock = function() {
    var d = $q.defer();
    d.reject.call(null, arguments);
    return d.promise;
  };

  var searchFactory = {
    newContext: function() {
      return mockSearchContext;
    }
  };

  beforeEach(module('ml.search'));

  beforeEach(function() {
    mockSearchContext = {
      fromParams: jasmine.createSpy('fromParams').and.callFake(asyncResolveMock),
      locationChange: jasmine.createSpy('locationChange').and.callFake(asyncResolveMock),
      search: jasmine.createSpy('search').and.callFake(asyncResolveMock),
      suggest: jasmine.createSpy('suggest').and.callFake(asyncResolveMock),
      showMoreFacets: jasmine.createSpy('showMoreFacets').and.callFake(asyncResolveMock),
      getParamsKeys: jasmine.createSpy('getParamsKeys'),
      getParams: jasmine.createSpy('getParams'),
      getText: jasmine.createSpy('getText'),
      getPage: jasmine.createSpy('getPage'),
      setText: jasmine.createSpy('setText').and.callFake(function() { return this; }),
      setPage: jasmine.createSpy('setPage').and.callFake(function() { return this; }),
      toggleFacet: jasmine.createSpy('toggleFacet').and.callFake(function() { return this; }),
      toggleNegatedFacet: jasmine.createSpy('toggleNegatedFacet').and.callFake(function() { return this; }),
      clearAllFacets: jasmine.createSpy('clearAllFacets').and.callFake(function() { return this; }),
      clearAdditionalQueries: jasmine.createSpy('clearAdditionalQueries').and.callFake(function() { return this; }),
      clearBoostQueries: jasmine.createSpy('clearBoostQueries').and.callFake(function() { return this; })
    };
  });

  describe('#class', function () {

    var $scope;

    beforeEach(inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      $location = $injector.get('$location');
      remoteInput = $injector.get('MLRemoteInputService');

      $scope = $rootScope.$new();
    }));

    it('should construct with new', function() {
      var ctrl = new MLRemoteSearchController($scope, $location, mockSearchContext, remoteInput);
      expect( ctrl instanceof MLRemoteSearchController ).toEqual(true);
    });

    it('should construct without new', function() {
      /* jshint newcap:false */
      var ctrl = MLRemoteSearchController($scope, $location, mockSearchContext, remoteInput);
      expect( ctrl instanceof MLRemoteSearchController ).toEqual(true);
    });

    it('inherited methods exist', function() {
      var ctrl = new MLRemoteSearchController($scope, $location, mockSearchContext, remoteInput);

      expect(ctrl.search).toBeDefined();
      expect(ctrl.search).toBe( MLSearchController.prototype.search );
      expect(ctrl.toggleFacet).toBeDefined();
      expect(ctrl.toggleFacet).toBe( MLSearchController.prototype.toggleFacet );
      expect(ctrl.toggleNegatedFacet).toBeDefined();
      expect(ctrl.toggleNegatedFacet).toBe( MLSearchController.prototype.toggleNegatedFacet );
      expect(ctrl.showMoreFacets).toBeDefined();
      expect(ctrl.showMoreFacets).toBe( MLSearchController.prototype.showMoreFacets );
      expect(ctrl.clearFacets).toBeDefined();
      expect(ctrl.clearFacets).toBe( MLSearchController.prototype.clearFacets );
      expect(ctrl.reset).toBeDefined();
      expect(ctrl.reset).toBe( MLSearchController.prototype.reset );
      expect(ctrl.suggest).toBeDefined();
      expect(ctrl.suggest).toBe( MLSearchController.prototype.suggest );
      expect(ctrl.locationChange).toBeDefined();
      expect(ctrl.locationChange).toBe( MLSearchController.prototype.locationChange );
      expect(ctrl.updateURLParams).toBeDefined();
      expect(ctrl.updateURLParams).toBe( MLSearchController.prototype.updateURLParams );
      expect(ctrl._search).toBeDefined();
      expect(ctrl._search).toBe( MLSearchController.prototype._search );
    });

    it('overriden methods exist', function() {
      var ctrl = new MLRemoteSearchController($scope, $location, mockSearchContext, remoteInput);

      expect(ctrl.init).toBeDefined();
      expect(ctrl.init).not.toBe( MLSearchController.prototype.init );
      expect(ctrl.updateSearchResults).toBeDefined();
      expect(ctrl.updateSearchResults).not.toBe( MLSearchController.prototype.updateSearchResults );
    });

    it('extension methods don\'t exist', function() {
      var ctrl = new MLRemoteSearchController($scope, $location, mockSearchContext, remoteInput);

      expect(ctrl.parseExtraURLParams).not.toBeDefined();
      expect(ctrl.updateExtraURLParams).not.toBeDefined();
    });
  });

  describe('#sample', function () {

    beforeEach(module('app'));

    beforeEach(inject(function ($controller, $injector) {
      $rootScope = $injector.get('$rootScope');
      $location = $injector.get('$location');
      $q = $injector.get('$q');
      remoteInput = $injector.get('MLRemoteInputService');

      ctrl = $controller('RemoteSearchCtrl', {
        $scope: $rootScope.$new(),
        $location: $location,
        MLSearchFactory: searchFactory,
        MLRemoteInputService: remoteInput
      });
    }));

    it('should wire remoteInput on init', function() {
      expect(ctrl.qtext).toEqual('');

      $rootScope.$apply();
      expect(mockSearchContext.search.calls.any()).toBe(true);

      mockSearchContext.search.calls.reset();
      expect(mockSearchContext.search.calls.any()).toBe(false);

      remoteInput.setInput('blah');
      expect(ctrl.qtext).toEqual('blah');
      expect(mockSearchContext.search.calls.any()).toBe(true);

      mockSearchContext.search.calls.reset();
      remoteInput.setInput('blah');
      expect(mockSearchContext.search.calls.any()).toBe(false);
    });

    it('should update remoteInput on updateSearchResults', function() {
      var spy = spyOn(remoteInput, 'setInput');
      expect(spy).not.toHaveBeenCalled();

      expect(ctrl.qtext).toEqual('');
      $rootScope.$apply();
      expect( remoteInput.input ).toEqual('');

      ctrl.qtext = 'blah'
      ctrl.search();
      $rootScope.$apply();

      expect(spy).toHaveBeenCalled();
    });

    it('should override superCtrl method', function() {
      var spy = spyOn(ctrl, 'updateSearchResults');
      var parentSpy = spyOn(MLSearchController.prototype, 'updateSearchResults');

      expect(spy).not.toHaveBeenCalled();
      expect(parentSpy).not.toHaveBeenCalled();

      ctrl.search();
      $rootScope.$apply();

      expect(spy).toHaveBeenCalled();
      expect(parentSpy).not.toHaveBeenCalled();
    });
  });

});

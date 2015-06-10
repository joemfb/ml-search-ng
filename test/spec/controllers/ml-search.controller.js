/* global describe, beforeEach, module, it, expect, inject, jasmine, MLSearchController */

describe('MLSearchController', function () {
  'use strict';

  var ctrl, $location, $rootScope, $q, mockSearchContext;

  var asyncMock = function() {
    return $q.defer().promise;
  };

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

  beforeEach(function() {
    mockSearchContext = {
      fromParams: jasmine.createSpy('fromParams').andCallFake(asyncResolveMock),
      locationChange: jasmine.createSpy('locationChange').andCallFake(asyncMock),
      search: jasmine.createSpy('search').andCallFake(asyncMock),
      suggest: jasmine.createSpy('suggest').andCallFake(asyncResolveMock),
      showMoreFacets: jasmine.createSpy('showMoreFacets').andCallFake(asyncMock),
      getParamsKeys: jasmine.createSpy('getParamsKeys'),
      getParams: jasmine.createSpy('getParams'),
      getText: jasmine.createSpy('getText'),
      getPage: jasmine.createSpy('getPage'),
      setText: jasmine.createSpy('setText').andCallFake(function() { return this; }),
      setPage: jasmine.createSpy('setPage').andCallFake(function() { return this; }),
      toggleFacet: jasmine.createSpy('toggleFacet').andCallFake(function() { return this; }),
      clearAllFacets: jasmine.createSpy('clearAllFacets').andCallFake(function() { return this; }),
      clearAdditionalQueries: jasmine.createSpy('clearAdditionalQueries').andCallFake(function() { return this; }),
      clearBoostQueries: jasmine.createSpy('clearBoostQueries').andCallFake(function() { return this; })
    };
  });

  describe('#class', function () {

    var $scope;

    beforeEach(inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $q = $injector.get('$q');
      $location = $injector.get('$location');

      $scope = $rootScope.$new();
    }));

    it('should construct with new', function() {
      var ctrl = new MLSearchController($scope, $location, mockSearchContext);
      expect( ctrl instanceof MLSearchController ).toEqual(true);
    });

    it('should construct without new', function() {
      /* jshint newcap:false */
      var ctrl = MLSearchController($scope, $location, mockSearchContext);
      expect( ctrl instanceof MLSearchController ).toEqual(true);
    });

    it('default methods exist', function() {
      var ctrl = new MLSearchController($scope, $location, mockSearchContext);

      expect(ctrl.init).toBeDefined;
      expect(ctrl.search).toBeDefined;
      expect(ctrl.toggleFacet).toBeDefined;
      expect(ctrl.showMoreFacets).toBeDefined;
      expect(ctrl.clearFacets).toBeDefined;
      expect(ctrl.reset).toBeDefined;
      expect(ctrl.suggest).toBeDefined;
      expect(ctrl.locationChange).toBeDefined;
      expect(ctrl.updateURLParams).toBeDefined;
      expect(ctrl._search).toBeDefined;
      expect(ctrl.updateSearchResults).toBeDefined;
    });

    it('extension methods don\'t exist', function() {
      var ctrl = new MLSearchController($scope, $location, mockSearchContext);

      expect(ctrl.parseExtraURLParams).not.toBeDefined;
      expect(ctrl.updateExtraURLParams).not.toBeDefined;
    });

    it('should update search results', function() {
      mockSearchContext.search = jasmine.createSpy('search').andCallFake(asyncResolveMock);
      var ctrl = new MLSearchController($scope, $location, mockSearchContext);
      ctrl.init();
      $scope.$apply();

      expect(mockSearchContext.getText).toHaveBeenCalled();
      expect(mockSearchContext.getPage).toHaveBeenCalled();
    });

    it('should call extension functions init (when they exist)', function() {
      var spyParse = jasmine.createSpy('parseExtraURLParams').andReturn(false);
      var spyUpdate = jasmine.createSpy('updateExtraURLParams').andReturn(false);
      var ctrl = new MLSearchController($scope, $location, mockSearchContext);

      ctrl.parseExtraURLParams = spyParse;
      ctrl.updateExtraURLParams = spyUpdate;
      ctrl.init();

      expect(spyParse).toHaveBeenCalled();
      expect(mockSearchContext.fromParams).toHaveBeenCalled();

      $scope.$apply();

      expect(spyUpdate).toHaveBeenCalled();
    });
  });

  describe('#sample', function () {

    beforeEach(module('app'));

    beforeEach(inject(function ($controller, $injector) {
      $rootScope = $injector.get('$rootScope');
      $location = $injector.get('$location');
      $q = $injector.get('$q');

      ctrl = $controller('SearchCtrl', {
        $scope: $rootScope.$new(),
        $location: $location,
        MLSearchFactory: searchFactory
      });
    }));

    it('should init from URL params', function() {
      expect(mockSearchContext.fromParams).toHaveBeenCalled();
    });

    it('should change with URL parameters', function() {
      expect(ctrl.qtext).toEqual('');
      $location.search({ q: 'hi' });
      $rootScope.$apply();

      expect(mockSearchContext.locationChange).toHaveBeenCalled();
      // expect(ctrl.qtext).toEqual('hi');
      expect(mockSearchContext.search).toHaveBeenCalled();
    });

    it('should update qtext and search', function() {
      expect( ctrl.qtext ).toEqual('');
      ctrl.search('hi');
      $rootScope.$apply();

      expect(mockSearchContext.search).toHaveBeenCalled();
      expect(ctrl.qtext).toEqual('hi');
    });

    it('should preserve qtext and search', function() {
      expect(ctrl.qtext).toEqual('');
      ctrl.qtext = 'hi';
      ctrl.search();
      $rootScope.$apply();

      expect(mockSearchContext.search).toHaveBeenCalled();
      expect(ctrl.qtext).toEqual('hi');
    });

    it('should get suggestions', function() {
      ctrl.suggest('hi');
      expect(mockSearchContext.suggest).toHaveBeenCalled();
    });

    it('should get suggestions or an empty array', function() {
      var suggestions;

      ctrl.suggest('hi')
      .then(function(response) {
        suggestions = response;
      });
      $rootScope.$apply();

      expect(mockSearchContext.suggest).toHaveBeenCalled();
      expect(suggestions).toBeDefined;
      expect(suggestions.length).toEqual(0);
    });

    it('should select facet and search', function() {
      ctrl.toggleFacet('color', 'red');
      $rootScope.$apply();

      expect(mockSearchContext.search).toHaveBeenCalled();
    });

    it('should show more facets', function() {
      ctrl.showMoreFacets(null, 'color', 10);
      $rootScope.$apply();

      expect(mockSearchContext.showMoreFacets).toHaveBeenCalled();
      var args = mockSearchContext.showMoreFacets.mostRecentCall.args;
      expect( args[0] ).toBeNull;
      expect( args[1] ).toEqual('color');
      expect( args[2] ).toEqual(10);
    });

    it('should clear facets and search', function() {
      ctrl.clearFacets();
      $rootScope.$apply();

      expect(mockSearchContext.clearAllFacets).toHaveBeenCalled();
      expect(mockSearchContext.search).toHaveBeenCalled();
    });

    it('should reset ctrl and search', function() {
      ctrl.qtext = 'hi';
      ctrl.page = 4;
      ctrl.reset();
      $rootScope.$apply();

      expect(mockSearchContext.search).toHaveBeenCalled();
      expect(mockSearchContext.clearAllFacets).toHaveBeenCalled();
      expect(mockSearchContext.clearAdditionalQueries).toHaveBeenCalled();
      expect(mockSearchContext.clearBoostQueries).toHaveBeenCalled();
      expect(ctrl.qtext).toEqual('');
      expect(ctrl.page).toEqual(1);
    });

    it('should parse extra URL params and search', function() {
      var spy = jasmine.createSpy('parseExtraURLParams').andReturn(true);
      mockSearchContext.locationChange = jasmine.createSpy('locationChange').andCallFake(asyncRejectMock);

      ctrl.parseExtraURLParams = spy;
      ctrl.locationChange();
      $rootScope.$apply();

      expect(spy).toHaveBeenCalled();
      expect(mockSearchContext.search).toHaveBeenCalled();
    });

    it('should parse extra URL params and not search', function() {
      var spy = jasmine.createSpy('parseExtraURLParams').andReturn(false);

      $rootScope.$apply();
      expect(mockSearchContext.search).toHaveBeenCalled();
      mockSearchContext.search.reset();

      ctrl.parseExtraURLParams = spy;
      mockSearchContext.locationChange = jasmine.createSpy('locationChange').andCallFake(asyncRejectMock);

      ctrl.locationChange();

      expect(spy).toHaveBeenCalled();

      $rootScope.$apply();
      expect(mockSearchContext.search).not.toHaveBeenCalled();
    });
  });
});

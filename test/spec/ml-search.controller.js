/* global describe, beforeEach, module, it, expect, inject */

describe('MLSearchController', function () {
  'use strict';

  var ctrl, $location, $rootScope, $q;

  var mockSearchContext = {
    fromParams: jasmine.createSpy('fromParams').andCallFake(function() {
      return $q.defer().promise;
    }),
    locationChange: jasmine.createSpy('locationChange').andCallFake(function() {
      return $q.defer().promise;
    })
  };

  var searchFactory = {
    newContext: function() {
      return mockSearchContext;
    }
  };

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

  it('should exist', function() {
    expect(ctrl).toBeDefined;
    expect(mockSearchContext.fromParams).toHaveBeenCalled();
  });

  it('default methods exist', function() {
    expect(ctrl.init).toBeDefined;
    expect(ctrl.search).toBeDefined;
    expect(ctrl.toggleFacet).toBeDefined;
    expect(ctrl.showMoreFacets).toBeDefined;
    expect(ctrl.suggest).toBeDefined;
    expect(ctrl.locationChange).toBeDefined;
    expect(ctrl.updateURLParams).toBeDefined;
    expect(ctrl._search).toBeDefined;
    expect(ctrl.updateSearchResults).toBeDefined;
  });

  it('extension methods don\'t exist', function() {
    expect(ctrl.parseExtraURLParams).not.toBeDefined;
    expect(ctrl.updateExtraURLParams).not.toBeDefined;
  })

  it('should change with URL parameters', function() {
    $location.search({ q: 'hi' })
    $rootScope.$apply()
    expect(mockSearchContext.locationChange).toHaveBeenCalled();
  });
});

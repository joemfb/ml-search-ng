/* global describe, beforeEach, module, it, expect, inject, jasmine */


describe('ml-chiclets', function () {
  'use strict';

  var elem, $scope, $compile, $rootScope, $templateCache;

  var activeFacets = {
    myFacet: {
      values: [{value:'value1', negated:'true'}, {value:'value2', negated:'false'}]
    }
  };

  beforeEach(module('ml.common'));
  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.activeFacets = activeFacets;
    $scope.toggleFacet = jasmine.createSpy('toggleFacet');
  }));

  describe('#defaults', function() {
    beforeEach(function() {
      elem = angular.element(
        '<ml-chiclets toggle="toggleFacet(facet, value)" ' +
                  'active-facets="activeFacets"></ml-chiclets>');
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should contain template', function() {
      expect(elem.find('.chiclets').length).toEqual(1);
    });

    it('should render each facet and facet value', function() {
      expect(elem.find('.chiclets > div > .btn').length).toEqual( activeFacets.myFacet.values.length );
    });

    it('should toggle the top button - first NOT negated facet', function() {
      elem.find('.chiclets > div > .btn > .glyphicon').eq(0).click();
      expect($scope.toggleFacet).toHaveBeenCalled();

      var args = $scope.toggleFacet.calls.mostRecent().args;
      expect( args[0] ).toEqual( 'myFacet' );
      expect( args[1] ).toEqual( activeFacets.myFacet.values[1].value );
    });

    it('should toggle the second button - negated facet', function() {
      elem.find('.chiclets > div > .btn > .glyphicon').eq(1).click();
      expect($scope.toggleFacet).toHaveBeenCalled();

      var args = $scope.toggleFacet.calls.mostRecent().args;
      expect( args[0] ).toEqual( 'myFacet' );
      expect( args[1] ).toEqual( activeFacets.myFacet.values[0].value );
    });
  });

  describe('#custom-template', function () {

    beforeEach(inject(function ($injector) {
      $templateCache = $injector.get('$templateCache');

      $templateCache.put( '/my-template.html', '<div class="custom-chiclets"></div>' );

      elem = angular.element( '<ml-chiclets active-facets="model.search.facets" '+
        'toggle="toggleFacet(facet, value)" facets="facets" template="/my-template.html"></ml-chiclets>' );
      $compile(elem)($scope);
      $scope.$digest();
    }));

    it('should contain template', function() {
      expect(elem.find('.custom-chiclets').length).toEqual(1);
    });

  });

});

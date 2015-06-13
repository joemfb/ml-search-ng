/* global describe, beforeEach, module, it, expect, inject, jasmine */


describe('ml-facets', function () {
  'use strict';

  var elem, $scope, $compile, $rootScope, $templateCache;

  var facets = {
    myFacet: {
      type: 'xs:string',
      facetValues: [
        { name: 'value1', value: 'value1', count: 20 },
        { name: 'value2', value: 'value2', count: 17 },
        { name: 'value3', value: 'value3', count: 12 },
        { name: 'value4', value: 'value4', count: 9 },
        { name: 'value5', value: 'value5', count: 3 }
      ]
    }
  };

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.facets = facets;
    $scope.toggleFacet = jasmine.createSpy('toggleFacet');
    $scope.showMoreFacets = jasmine.createSpy('showMoreFacets');
  }));

  describe('#defaults', function () {

    beforeEach(function() {
      elem = angular.element(
        '<ml-facets facets="facets" toggle="toggleFacet(facet, value)" ' +
                   'show-more="showMoreFacets(facet, facetName)"></ml-facets>');
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should contain template', function() {
      expect(elem.find('.facet-list').length).toEqual(1);
    });

    it('should render each facet and facetValue', function() {
      expect(elem.find('.facet-list > .facet').length).toEqual(1); // _.keys(facets).length
      expect(elem.find('.facet-list > .facet > div').length).toEqual( facets.myFacet.facetValues.length + 1 );
    });

    it('should toggle facet', function() {
      elem.find('.facet > div > a').eq(0).click();
      expect($scope.toggleFacet).toHaveBeenCalled();

      var args = $scope.toggleFacet.calls.mostRecent().args;
      expect( args[0] ).toEqual( 'myFacet' );
      expect( args[1] ).toEqual( facets.myFacet.facetValues[0].name );
    });

    it('should show more facets', function() {
      elem.find('.facet > div:last-child() > a').eq(0).click();
      expect($scope.showMoreFacets).toHaveBeenCalled();

      var args = $scope.showMoreFacets.calls.mostRecent().args;
      expect( args[1] ).toEqual( 'myFacet' );
    });

  });

  describe('#inline', function () {

    beforeEach(function() {
      elem = angular.element(
        '<ml-facets facets="facets" toggle="toggleFacet(facet, value)" ' +
                   'show-more="showMoreFacets(facet, facetName)" template="inline">' +
        '</ml-facets>'
      );
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should contain template', function() {
      expect(elem.find('.facet-list').length).toEqual(1);
    });

    it('should render each facet and facetValue', function() {
      expect(elem.find('.facet-list > .facet').length).toEqual(1);
      expect(elem.find('.facet-list > .facet > div').length).toEqual( facets.myFacet.facetValues.length + 1 );
    });

    it('should toggle facet', function() {
      elem.find('.facet > div > a').eq(0).click();
      expect($scope.toggleFacet).toHaveBeenCalled();

      var args = $scope.toggleFacet.calls.mostRecent().args;
      expect( args[0] ).toEqual( 'myFacet' );
      expect( args[1] ).toEqual( facets.myFacet.facetValues[0].name );
    });

    it('should show more facets', function() {
      elem.find('.facet > div:last-child() > a').eq(0).click();
      expect($scope.showMoreFacets).toHaveBeenCalled();

      var args = $scope.showMoreFacets.calls.mostRecent().args;
      expect( args[1] ).toEqual( 'myFacet' );
    });

  });

  describe('#custom-template', function () {

    beforeEach(inject(function ($injector) {
      $templateCache = $injector.get('$templateCache');

      $templateCache.put( '/my-template.html', '<div class="custom-facets"></div>' );

      elem = angular.element( '<ml-facets facets="facets" template="/my-template.html"></ml-facets>' );
      $compile(elem)($scope);
      $scope.$digest();
    }));

    it('should contain template', function() {
      expect(elem.find('.custom-facets').length).toEqual(1);
    });

  });

});

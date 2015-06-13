/* global describe, beforeEach, module, it, expect, inject, jasmine */

describe('ml-input', function () {
  'use strict';

  var elem, $scope, $compile, $rootScope, $templateCache;

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.qtext = '';
    $scope.search = jasmine.createSpy('search');
    $scope.suggest = jasmine.createSpy('suggest');
  }));

  describe('#defaults', function () {

    beforeEach(function() {
      elem = angular.element('<ml-input qtext="qtext" search="search(qtext)" suggest="suggest(val)"></ml-input>');
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should contain template', function() {
      expect(elem.find('.ml-search').length).toEqual(1);
      expect(elem.find('.ml-search > div.form-group').length).toEqual(1);
    });

    it('should display qtext', function() {
      $scope.qtext = 'hi';
      $scope.$apply();
      expect( elem.find('input')[0].value ).toEqual('hi');
    });

    it('should invoke search', function() {
      $scope.qtext = 'hi';
      $scope.$apply();

      elem.find('button').eq(0).click();
      expect($scope.search).toHaveBeenCalled();

      var args = $scope.search.calls.mostRecent().args;
      expect( args[0] ).toEqual( 'hi' );
    });

    it('should invoke clear', function() {
      $scope.qtext = 'hi';
      $scope.$apply();

      elem.find('button').eq(1).click();
      expect($scope.search).toHaveBeenCalled();

      var args = $scope.search.calls.mostRecent().args;
      expect( args[0] ).toEqual('');
    });

  });

  describe('#fa', function () {

    beforeEach(function() {
      elem = angular.element('<ml-input qtext="qtext" search="search(qtext)" suggest="suggest(val)" template="fa"></ml-input>');
      $compile(elem)($scope);
      $scope.$digest();
    });

    it('should contain template', function() {
      expect(elem.find('.ml-search').length).toEqual(1);
      expect(elem.find('.ml-search > div.input-group').length).toEqual(1);
    });

    it('should display qtext', function() {
      $scope.qtext = 'hi';
      $scope.$apply();
      expect( elem.find('input')[0].value ).toEqual('hi');
    });

    it('should invoke search', function() {
      $scope.qtext = 'hi';
      $scope.$apply();

      elem.find('.search-submit').eq(0).click();
      expect($scope.search).toHaveBeenCalled();

      var args = $scope.search.calls.mostRecent().args;
      expect( args[0] ).toEqual( 'hi' );
    });

    it('should invoke clear', function() {
      $scope.qtext = 'hi';
      $scope.$apply();

      elem.find('.search-input-clear').eq(0).click();
      expect($scope.search).toHaveBeenCalled();

      var args = $scope.search.calls.mostRecent().args;
      expect( args[0] ).toEqual('');
    });

  });

  describe('#custom-template', function () {

    beforeEach(inject(function ($injector) {
      $templateCache = $injector.get('$templateCache');
      $templateCache.put(
        '/my-template.html',
        '<div class="custom-search" ng-click="suggest({ val: \'hi\' })"></div>'
      );

      elem = angular.element(
        '<ml-input qtext="qtext" search="search(qtext)" suggest="suggest(val)" template="/my-template.html"></ml-input>'
      );
      $compile(elem)($scope);
      $scope.$digest();
    }));

    it('should contain template', function() {
      expect(elem.find('.custom-search').length).toEqual(1);
    });

    it('should trigger suggest', function() {
      elem.find('.custom-search').eq(0).click();
      expect($scope.suggest).toHaveBeenCalled();

      var args = $scope.suggest.calls.mostRecent().args;
      expect( args[0] ).toEqual('hi');
    });

  });

});

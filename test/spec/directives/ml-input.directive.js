/* global describe, beforeEach, module, it, expect, inject */
'use strict';

var elem, $scope, $compile, $rootScope;

describe('ml-input', function () {

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.qtext = '';
    $scope.search = jasmine.createSpy('search');
    $scope.suggest = jasmine.createSpy('suggest');

    elem = angular.element('<ml-input qtext="qtext" search="search(qtext)" suggest="suggest(val)"></ml-input>');

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should contain template', function() {
    expect(elem.find('.ml-search').length).toEqual(1);
  });

  it('should display qtext', function() {
    $scope.qtext = 'hi'
    $scope.$apply();
    expect( elem.find('input')[0].value ).toEqual('hi');
  });

  it('should invoke search', function() {
    $scope.qtext = 'hi'
    $scope.$apply();

    elem.find('button').eq(0).click()
    expect($scope.search).toHaveBeenCalled();

    var args = $scope.search.mostRecentCall.args;
    expect( args[0] ).toEqual( 'hi' );
  });

  it('should invoke clear', function() {
    $scope.qtext = 'hi';
    $scope.$apply();

    elem.find('button').eq(1).click()
    expect($scope.search).toHaveBeenCalled();

    var args = $scope.search.mostRecentCall.args;
    expect( args[0] ).toEqual('');
  });

  // TODO
  // it('should invoke suggest', function() {
  //   // var e = $.Event("keydown");
  //   // e.which = 39;
  //   // element.trigger(e);

  //   // elem.find('input').eq(0).trigger(e)

  //   // $scope.qtext = 'h';
  //   var input = elem.find('input').eq(0);

  //   input.value = 'h';
  //   input.triggerHandler('input');

  //   $scope.$digest();
  //   $scope.$apply();

  //   expect($scope.suggest).toHaveBeenCalled();

  //   var args = $scope.suggest.mostRecentCall.args;
  //   console.log(args)
  //   // expect( args[0] ).toEqual('');
  // });

});

describe('ml-input#fa', function () {

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.qtext = '';
    $scope.search = jasmine.createSpy('search');
    $scope.suggest = jasmine.createSpy('suggest');

    elem = angular.element('<ml-input qtext="qtext" search="search(qtext)" suggest="suggest(val)" template="fa"></ml-input>');

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should contain template', function() {
    expect(elem.find('.ml-search').length).toEqual(1);
  });

  it('should display qtext', function() {
    $scope.qtext = 'hi'
    $scope.$apply();
    expect( elem.find('input')[0].value ).toEqual('hi');
  });

  it('should invoke search', function() {
    $scope.qtext = 'hi'
    $scope.$apply();

    elem.find('.search-submit').eq(0).click()
    expect($scope.search).toHaveBeenCalled();

    var args = $scope.search.mostRecentCall.args;
    expect( args[0] ).toEqual( 'hi' );
  });

  it('should invoke clear', function() {
    $scope.qtext = 'hi';
    $scope.$apply();

    elem.find('.search-input-clear').eq(0).click()
    expect($scope.search).toHaveBeenCalled();

    var args = $scope.search.mostRecentCall.args;
    expect( args[0] ).toEqual('');
  });

});

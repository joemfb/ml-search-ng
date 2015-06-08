/* global describe, beforeEach, module, it, expect, inject */
'use strict';

var elem, $scope, $compile, $rootScope;

var response = {
  start: 1,
  'page-length': 10,
  total: 45,
  metrics: {
    'query-resolution-time':'PT0.007575S',
    'facet-resolution-time':'PT0.01598S',
    'snippet-resolution-time':'PT0.017144S',
    'total-time':'PT0.054741S'
  }
};

describe('ml-metrics', function () {

  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.response = response;
    $scope.showDuration = true;

    elem = angular.element('<ml-metrics search="response" show-duration="showDuration"></ml-metrics>');

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should be replaced by template', function() {
    expect(elem).toHaveClass('search-metrics');
  });

  it('should toggle duration', function() {
    //TODO: add classes to test more clearly
    expect(elem.find('> span.ng-hide').length).toEqual(1);
    expect(elem.find('> span.ng-isolate-scope.ng-hide').length).toEqual(0);

    $scope.showDuration = false;
    $scope.$apply();

    expect(elem.find('> span.ng-isolate-scope.ng-hide').length).toEqual(1);
  });

});

describe('ml-metrics#transclude', function () {
  beforeEach(module('ml.search'));
  beforeEach(module('ml.search.tpls'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.response = response;
    $scope.showDuration = true;

    elem = angular.element(
      '<ml-metrics search="response" show-duration="showDuration">' +
        '<div class="blah"></div>' +
      '</ml-metrics>'
    );

    // append to document, since transclusion is performed via `element.replaceWith()`
    angular.element(document.body).append(elem);
    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should transclude', function() {
    expect( angular.element(document.body).find('div') ).toHaveClass('blah');
  });
});
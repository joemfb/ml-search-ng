(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlResults', mlResults);

  function mlResults() {
    return {
      restrict: 'E',
      scope: {
        results: '=',
        link: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      url = attrs.template;
    }
    else {
      url = '/templates/ml-results.html';
    }

    return url;
  }

  function link(scope, element, attrs) {
    //default link fn
    if (!attrs.link) {
      scope.link = function(result) {
        //weird object hierarchy because directive methods requiring objects (?)
        return '/detail?uri=' + result.result.uri;
      };
    }

    scope.$watch('results', function (newVal, oldVal) {
      _.each(newVal, function(result) {
        result.link = scope.link({ result: result });
      });
    });
  }

}());

(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlInput', mlInput);

  function mlInput() {
    return {
      restrict: 'E',
      scope: {
        qtext: '=',
        search: '&',
        suggest: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url = '/templates/ml-input.html';
    return url;
  }

  function link($scope, element) {
    $scope.clear = function() {
      $scope.search({ qtext: '' });
    };
  }

}());

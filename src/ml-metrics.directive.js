(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlMetrics', mlMetrics);

  var $window = null;

  mlMetrics.$inject = ['$window'];

  function mlMetrics($injectWindow) {
    $window = $injectWindow;

    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: '/templates/ml-metrics.html',
      scope: {
        search: '=',
        showDuration: '=?'
      },
      link: link
    };
  }

  function link($scope, element, attrs, ctrl, transclude) {
    if ($scope.showDuration === undefined) {
      $scope.showDuration = true;
    }

    $scope.$watch('search', function(search) {
      angular.extend($scope, parseSearch(search));
    });

    transclude($scope, function(clone) {
      if (clone.length) {
        element.replaceWith(clone);
      }
    });
  }

  function parseSearch(search) {
    return {
      total: search.total,
      start: search.start,
      pageLength: search['page-length'],
      pageEnd: $window.Math.min(search.start + search['page-length'] - 1, search.total),
      metrics: search.metrics
    };
  }

}());

(function() {

  'use strict';

  /**
   * angular element directive; displays search metrics.
   *
   * attributes:
   *
   * - `search`: a reference to the search results object from {@link MLSearchContext#search}
   * - `showDuration`: optional boolean. defaults to `true`
   *
   * Transcludes markup, and creates a new scope with the following properties:
   *
   * - `total`: The total number of search results
   * - `start`: The index of the first displayed search result
   * - `pageLength`: The length of the search results page
   * - `pageEnd`: the index of the last displayed search result
   * - `metrics`: a reference to the `metrics` property of the search results object passed to the `search` attribute
   *
   * Example:
   *
   * ```
   * <ml-metrics search="ctrl.response"></ml-metrics>```
   *
   * Transclusion Example:
   *
   * ```
   * <ml-metrics search="ctrl.response">
   *   Showing {{ pageLength }} results in
   *   <span ml-duration="metrics['total-time']">{{ duration.seconds | number:2 }}</span>
   *   seconds.
   * </ml-metrics>```
   *
   * @namespace ml-metrics
   */
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

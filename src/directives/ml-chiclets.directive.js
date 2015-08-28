(function() {

  'use strict';

  /**
   * angular element directive; displays chiclets.
   *
   * attributes:
   *
   * - `activeFacets`: a reference to the `activeFacets` property of {@link MLSearchContext}
   * - `toggle`: a reference to a function that will select or clear facets based on their state. Invoked with `facet` (name) and `value` parameters. This function should invoke `mlSearch.toggleFacet(facetName, value).search()`
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used.
   * - `truncate`: optional. The length at which to truncate the facet display. Defaults to `20`.
   *
   * Example:
   *
   * ```
   * <ml-chiclets active-facets="ctrl.mlSearch.activeFacets" toggle="ctrl.toggleFacet(facet, value)"></ml-chiclets>```
   *
   * @namespace ml-chiclets
   */
  angular.module('ml.search')
    .directive('mlChiclets', mlChiclets);

  function mlChiclets() {
    return {
      restrict: 'E',
      scope: {
        activeFacets: '=',
        toggle: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      url = attrs.template;
    } else {
      url = '/templates/ml-chiclets.html';
    }

    return url;
  }

  function link($scope, element, attrs) {
    $scope.truncateLength = parseInt(attrs.truncate) || 20;
  }

}());

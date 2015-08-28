(function() {

  'use strict';

  /**
   * angular element directive; displays facets.
   *
   * attributes:
   *
   * - `facets`: the `facets` property of a search results object from {@link MLSearchContext#search}. (`ctrl.response.facets` on {@link MLSearchController})
   * - `toggle`: A function to select/clear facets. Should invoke `mlSearch.toggleFacet(facetName, value).search()`. ({@link MLSearchController#toggleFacet})
   * - `negate`: optional. A function to negate/clear facets. Should invoke `mlSearch.toggleNegatedFacet(facetName, value).search()`. ({@link MLSearchController#toggleNegatedFacet})
   * - `showMore`: optional. A function get the next `n` (default `5`) facets values. Should invoke `mlSearch.showMoreFacets(facet, facetName)`. ({@link MLSearchController#showMoreFacets})
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used (chiclet-style facets). If `"inline"`, a bootstrap/font-awesome template will be used (inline facet selections)
   * - `truncate`: optional. The length at which to truncate the facet display. Defaults to `20`.
   *
   * Example:
   *
   * ```
   * <ml-facets facets="ctrl.response.facets" toggle="ctrl.toggleFacet(facet, value)" show-more="ctrl.showMoreFacets(facet, facetName)"></ml-facets>```
   *
   * @namespace ml-facets
   */
  angular.module('ml.search')
    .directive('mlFacets', mlFacets)
    .controller('mlFacetsController', ['$scope', '$filter', mlFacetsController]);

  function mlFacets() {
    return {
      restrict: 'E',
      controller: 'mlFacetsController',
      scope: {
        activeFacets: '=',
        facets: '=',
        toggle: '&',
        negate: '&',
        showMore: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      if (attrs.template === 'inline') {
        url = '/templates/ml-facets-inline.html';
      } else {
        url = attrs.template;
      }
    } else {
      url = '/templates/ml-facets.html';
    }

    return url;
  }

  function link($scope, element, attrs) {
    $scope.truncateLength = parseInt(attrs.truncate) || 20;
    $scope.shouldShowMore = !!attrs.showMore;
    $scope.shouldNegate = !!attrs.negate && !!attrs.activeFacets;
  }

  function mlFacetsController($scope, $filter) {
    $scope.filter = $filter('filter');
  }

}());

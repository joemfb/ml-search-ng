(function () {

  'use strict';

  /**
   * angular element directive; displays facets.
   *
   * attributes:
   *
   * - `facets`: a reference to the `facets` property of the search results object from {@link MLSearchContext#search}
   * - `toggle`: a reference to a function that will select or clear facets based on their state. Invoked with `facet` (name) and `value` parameters. This function should invoke `mlSearch.toggleFacet(facetName, value).search()`
   * - `showMore`: a reference to a function that will pull down the next five facets. This is invoked with the `facet` itself and the `facetName`. This function should by default invoke `mlSearch.showMoreFacets(facet, facetName)`
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used (chiclet-style facets). If `"inline"`, a bootstrap/font-awesome template will be used (inline facet selections)
   * - `truncate`: optional. The length at which to truncate the facet display. Defaults to `20`.
   *
   * Example:
   *
   * ```
   * <ml-facets facets="model.search.facets" toggle="toggleFacet(facet, value)" show-more="showMoreFacets(facet, facetName)"></ml-facets>```
   *
   * @namespace ml-facets
   */
  angular.module('ml.search')
    .directive('mlFacets', mlFacets);

  function mlFacets() {
    return {
      restrict: 'E',
      scope: {
        facets: '=',
        toggle: '&',
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
    }
    else {
      url = '/templates/ml-facets.html';
    }

    return url;
  }

  function link($scope, element, attrs) {
    $scope.truncateLength = parseInt(attrs.truncate) || 20;
    $scope.shouldShowMore = !!attrs.showMore;
  }

}());

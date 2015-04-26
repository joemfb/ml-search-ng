(function () {

  'use strict';

  /**
   * angular element directive; displays facets.
   *
   * attributes:
   *
   * - `facets`: a reference to the `facets` property of the search results object from {@link MLSearchContext#search}
   * - `toggle`: a reference to a function that will select or clear facets based on their state. Invoked with `facet` (name) and `value` parameters. This function should invoke `mlSearch.toggleFacet(facetName, value).search()`
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used (chiclet-style facets). If `"inline"`, a bootstrap/font-awesome template will be used (inline facet selections)
   *
   * Example:
   *
   * ```
   * <ml-facets facets="model.search.facets" toggle="toggleFacet(facet, value)"></ml-facets>```
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
        toggle: '&'
      },
      templateUrl: template
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

}());

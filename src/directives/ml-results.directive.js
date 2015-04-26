(function () {

  'use strict';

  /**
   * angular element directive; displays search results.
   *
   * Binds a `link` property to each result object, based on the result of the function passed to the `link` attribute. If no function is passed a default function is provided. The resulting `link` property will have the form `/detail?uri={{ result.uri }}`
   *
   * attributes:
   *
   * - `search`: a reference to the search results object from {@link MLSearchContext#search}
   * - `link`: optional. a function that accepts a `result` object, and returns a URL to be used as the link target in the search results display
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used.
   *
   * Example:
   *
   * ```
   * <ml-results results="model.search.results" link="linkTarget(result)"></ml-results>```
   *
   * @namespace ml-results
   */
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

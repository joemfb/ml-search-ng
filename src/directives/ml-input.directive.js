(function () {

  'use strict';

  /**
   * angular element directive; a search-input form.
   *
   * attributes:
   *
   * - `qtext`: a reference to the model property containing the search phrase
   * - `search`: a function reference. The function will be called with a parameter named `qtext`
   * - `suggest`: a function reference. The function will be called with a parameter named `val`
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used. If `"fa"`, a bootstrap/font-awesome template will be used. **Note: the `"fa"` template _requires_ bootstrap 3.2.0 or greater.**
   *
   * Example:
   *
   * ```
   * <ml-input qtext="model.qtext" search="search(qtext)" suggest="suggest(val)"></ml-input>```
   *
   * @namespace ml-input
   */
  angular.module('ml.search')
    .directive('mlInput', mlInput);

  function mlInput() {
    return {
      restrict: 'E',
      scope: {
        qtext: '=',
        search: '&',
        suggest: '&',
        save: '&'
      },
      templateUrl: template,
      link: link
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      if (attrs.template === 'fa') {
        url = '/templates/ml-input-fa.html';
      } else {
        url = attrs.template;
      }
    }
    else {
      url = '/templates/ml-input.html';
    }

    return url;
  }

  function link($scope, element, attrs) {

    $scope.saveEnabled = !!attrs.save;

    $scope.clear = function() {
      $scope.search({ qtext: '' });
    };
  }

}());

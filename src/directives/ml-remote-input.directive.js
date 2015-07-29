(function() {

  'use strict';

  /**
   * angular element directive; creates a search-input form, outside of the scope of a controller.
   *
   * Uses {@link MLRemoteInputService} to communicate with a controller. Wraps {@link ml-input}.
   *
   * attributes:
   *
   * - `searchCtrl`: the name of the controller to interface with. defaults to `'SearchCtrl'`
   * - `template`: passed to `ml-input`
   *
   * Example:
   *
   * ```
   * <ml-remote-input search-ctrl="MySearchCtrl" template="fa"></ml-remote-input>```
   *
   * In the search controller, inherit from {@link MLRemoteSearchController}, as documented at that link
   *
   * @namespace ml-remote-input
   */
  angular.module('ml.search')
    .directive('mlRemoteInput', mlRemoteInput)
    .controller('MLRemoteInputController', MLRemoteInputController);

  function mlRemoteInput() {
    return {
      restrict: 'E',
      controller: 'MLRemoteInputController',
      scope: {
        searchCtrl: '@',
        template: '@'
      },
      template: template
    };
  }

  function template(element, attrs) {
    var tpl = '';

    if ( attrs.template ) {
      tpl = ' template="' + attrs.template + '"';
    }
    return '<ml-input qtext="qtext" search="search(qtext)" ' +
           'suggest="suggest(val)"' + tpl + '></ml-input>';
  }

  MLRemoteInputController.$inject = ['$scope', '$location', 'MLSearchFactory', 'MLRemoteInputService'];

  function MLRemoteInputController($scope, $location, factory, remoteInput) {
    var mlSearch = factory.newContext(),
        searchPath;

    $scope.qtext = remoteInput.input;
    remoteInput.initInput($scope, mlSearch);

    /*
     * watch the `searchCtrl` property, and update search path
     * (allows for instrumentation by a parent controller)
     */
    $scope.$watch('searchCtrl', function(val) {
      var oldSearchPath = searchPath;

      val = val || 'SearchCtrl';
      searchPath = remoteInput.getPath( val );

      if ( oldSearchPath && searchPath !== oldSearchPath ) {
        $scope.search('');
      }
    });

    /*
     * Search function for ml-input directive:
     * redirects to the search ctrl if necessary,
     * passes the input qtext to the remoteInput service
     *
     * @param {string} qtext
     */
    $scope.search = function search(qtext) {
      // TODO: clear params if not on the search path
      // if ( $location.path() !== searchPath ) {
      //   $location.search({});
      //   $location.path( searchPath );
      // }

      $location.path( searchPath );
      remoteInput.setInput(qtext);
    };

    /*
     * suggest function for the ml-input directive
     * gets an MLSearchContext instance from the remoteInput service
     * (if possible)
     *
     * @param {string} partial qtext
     * @return {Promise} a promise to be resolved with search suggestions
     */
    $scope.suggest = function suggest(val) {
      mlSearch = remoteInput.mlSearch || mlSearch;
      return mlSearch.suggest(val).then(function(res) {
        return res.suggestions || [];
      });
    };
  }

}());

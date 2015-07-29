/**
 * @class MLSearchController
 * @classdesc base search controller class; the prototype for an angular search controller
 *
 * Note: this style requires you to use the `controllerAs` syntax.
 *
 * <pre class="prettyprint">
 *   (function() {
 *     'use strict';
 *
 *     angular.module('app').controller('SearchCtrl', SearchCtrl);
 *
 *     SearchCtrl.$inject = ['$scope', '$location', 'MLSearchFactory'];
 *
 *     // inherit from MLSearchController
 *     var superCtrl = MLSearchController.prototype;
 *     SearchCtrl.prototype = Object.create(superCtrl);
 *
 *     function SearchCtrl($scope, $location, searchFactory) {
 *       var ctrl = this;
 *       var mlSearch = searchFactory.newContext();
 *
 *       MLSearchController.call(ctrl, $scope, $location, mlSearch);
 *
 *       // override a superCtrl method
 *       ctrl.updateSearchResults = function updateSearchResults(data) {
 *         superCtrl.updateSearchResults.apply(ctrl, arguments);
 *         console.log('updated search results');
 *       }
 *
 *       ctrl.init();
 *     }
 *   })();
 * </pre>
 *
 * @param {Object} $scope - child controller's scope
 * @param {Object} $location - angular's $location service
 * @param {MLSearchContext} mlSearch - child controller's searchContext
 *
 * @prop {Object} $scope - child controller's scope
 * @prop {Object} $location - angular's $location service
 * @prop {MLSearchContext} mlSearch - child controller's searchContext
 * @prop {Boolean} searchPending - signifies whether a search is in progress
 * @prop {Number} page - the current results page
 * @prop {String} qtext - the current query text
 * @prop {Object} response - the search response object
 */

function MLSearchController($scope, $location, mlSearch) {
  'use strict';
  if ( !(this instanceof MLSearchController) ) {
    return new MLSearchController($scope, $location, mlSearch);
  }

  // TODO: error if not passed
  this.$scope = $scope;
  this.$location = $location;
  this.mlSearch = mlSearch;

  this.searchPending = false;
  this.page = 1;
  this.qtext = '';
  this.response = {};
}

/**
 * <strong>UNIMPLEMENTED EXTENSION METHOD</strong>
 *
 * implement to support extra URL params that can trigger a search;
 *
 * should read extra URL params, and update the controller state
 *
 * @method MLSearchController#parseExtraURLParams
 * @return {Boolean} should a search be triggered
 */

/**
 * <strong>UNIMPLEMENTED EXTENSION METHOD</strong>
 *
 * implement to support additional URL params that can trigger a search;
 *
 * should update extra URL params from the controller state
 *
 * @method MLSearchController#updateExtraURLParams
 */

(function() {
  'use strict';

  /**
   * initialize the controller, setting the search state form URL params,
   * and creating a handler for the `$locationChangeSuccess` event
   *
   * @memberof MLSearchController
   * @return {Promise} the promise from {@link MLSearchContext#fromParams}
   */
  MLSearchController.prototype.init = function init() {
    // monitor URL params changes (forward/back, etc.)
    this.$scope.$on('$locationChangeSuccess', this.locationChange.bind(this));

    // capture initial URL params in mlSearch and ctrl
    if ( this.parseExtraURLParams ) {
      this.parseExtraURLParams();
    }

    return this.mlSearch.fromParams()
      .then( this._search.bind(this) );
  };

  /**
   * handle the `$locationChangeSuccess` event
   *
   * checks if mlSearch URL params or additional params have changed
   * (using the child controller's `parseExtraURLParams()` method, if available),
   * and, if necessary, initiates a search via {@link MLSearchController#_search}
   *
   * @memberof MLSearchController
   * @param {Object} e - the `$locationChangeSuccess` event object
   * @param {String} newUrl
   * @param {String} oldUrl
   * @return {Promise} the promise from {@link MLSearchContext#locationChange}
   */
  MLSearchController.prototype.locationChange = function locationChange(e, newUrl, oldUrl) {
    var self = this,
        shouldUpdate = false;

    if ( this.parseExtraURLParams ) {
      shouldUpdate = this.parseExtraURLParams();
    }

    return this.mlSearch.locationChange( newUrl, oldUrl )
      .then(
        this._search.bind(this),
        function() {
          if (shouldUpdate) {
            self._search.call(self);
          }
        }
      );
  };

  /**
   * search implementation function
   *
   * sets {@link MLSearchController#searchPending} to `true`,
   * invokes {@link MLSearchContext#search} with {@link MLSearchController#updateSearchResults} as the callback,
   * and invokes {@link MLSearchController#updateURLParams}
   *
   * @memberof MLSearchController
   * @return {Promise} the promise from {@link MLSearchContext#search}
   */
  MLSearchController.prototype._search = function _search() {
    this.searchPending = true;

    var promise = this.mlSearch.search()
      .then( this.updateSearchResults.bind(this) );

    this.updateURLParams();
    return promise;
  };

  /**
   * updates controller state with search results
   *
   * sets {@link MLSearchController#searchPending} to `true`,
   * sets {@link MLSearchController#response}, {@link MLSearchController#qtext},
   * and {@link MLSearchController#page} to values from the response
   *
   * @memberof MLSearchController
   * @param {Object} data - the response from {@link MLSearchContext#search}
   * @return {MLSearchController} `this`
   */
  MLSearchController.prototype.updateSearchResults = function updateSearchResults(data) {
    this.searchPending = false;
    this.response = data;
    this.qtext = this.mlSearch.getText();
    this.page = this.mlSearch.getPage();
    return this;
  };

  /**
   * updates URL params based on the current {@link MLSearchContext} state, preserving any additional params.
   * invokes the child controller's `updateExtraURLParams()` method, if available
   *
   * @memberof MLSearchController
   * @return {MLSearchController} `this`
   */
  MLSearchController.prototype.updateURLParams = function updateURLParams() {
    var params = _.chain( this.$location.search() )
      .omit( this.mlSearch.getParamsKeys() )
      .merge( this.mlSearch.getParams() )
      .value();

    this.$location.search( params );

    if ( this.updateExtraURLParams ) {
      this.updateExtraURLParams();
    }
    return this;
  };

  /**
   * the primary search method, for use with any user-triggered searches (for instance, from an input control)
   *
   * @memberof MLSearchController
   * @param {String} [qtext] - if present, updates the state of {@link MLSearchController#qtext}
   * @return {Promise} the promise from {@link MLSearchController#_search}
   */
  MLSearchController.prototype.search = function search(qtext) {
    if ( arguments.length ) {
      this.qtext = qtext;
    }

    this.mlSearch.setText( this.qtext ).setPage( this.page );
    return this._search();
  };

  /**
   * clear qtext, facet selections, boost queries, and additional queries. Then, run a search.
   *
   * @memberof MLSearchController
   * @return {Promise} the promise from {@link MLSearchController#_search}
   */
  MLSearchController.prototype.reset = function reset() {
    this.mlSearch
      .clearAllFacets()
      .clearAdditionalQueries()
      .clearBoostQueries();
    this.qtext = '';
    this.page = 1;
    return this._search();
  };

  /**
   * toggle the selection state of the specified facet value
   *
   * @memberof MLSearchController
   * @param {String} facetName - the name of the facet to toggle
   * @param {String} value - the value of the facet to toggle
   * @return {Promise} the promise from {@link MLSearchController#_search}
   */
  MLSearchController.prototype.toggleFacet = function toggleFacet(facetName, value) {
    this.mlSearch.toggleFacet( facetName, value );
    return this._search();
  };

  /**
   * toggle the selection state of the specified NEGATED facet value
   *
   * @memberof MLSearchController
   * @param {String} facetName - the name of the NEGATED facet to toggle
   * @param {String} value - the value of the NEGATED facet to toggle
   * @return {Promise} the promise from {@link MLSearchController#_search}
   */
  MLSearchController.prototype.toggleNegatedFacet = function toggleNegatedFacet(facetName, value) {
    this.mlSearch.toggleFacet( facetName, value, true );
    return this._search();
  };

  /**
   * Appends additional facet values to the provided facet object.
   *
   * @memberof MLSearchController
   * @param {Object} facet - a facet object from {@link MLSearchController#response}
   * @param {String} facetName - facet name
   * @param {Number} [step] - the number of additional facet values to retrieve (defaults to `5`)
   * @return {Promise} the promise from {@link MLSearchContext#showMoreFacets}
   */
  MLSearchController.prototype.showMoreFacets = function showMoreFacets(facet, facetName, step) {
    return this.mlSearch.showMoreFacets(facet, facetName, step);
  };

  /**
   * clear all facet selections, and run a search
   *
   * @memberof MLSearchController
   * @return {Promise} the promise from {@link MLSearchController#_search}
   */
  MLSearchController.prototype.clearFacets = function clearFacets() {
    this.mlSearch.clearAllFacets();
    return this._search();
  };

  /**
   * Gets search phrase suggestions based on the current state.
   * This method can be passed directly to the ui-bootstrap `typeahead` directive.
   *
   * @memberof MLSearchController
   * @param {String} qtext - the partial-phrase to match
   * @param {String|Object} [options] - string options name (to override suggestOptions), or object for adhoc combined query options
   * @return {Promise} the promise from {@link MLSearchContext#suggest}
   */
  MLSearchController.prototype.suggest = function suggest(qtext, options) {
    return this.mlSearch.suggest(qtext, options).then(function(res) {
      return res.suggestions || [];
    });
  };

})();

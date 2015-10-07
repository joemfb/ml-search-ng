(function() {
  'use strict';

  angular.module('ml.search', ['ml.common']);

}());

/* global MLSearchController */

/**
 * @class MLRemoteSearchController
 * @augments MLSearchController
 * @classdesc <strong>extends {@link MLSearchController}</strong>
 *
 * base search controller class; the prototype for an angular search controller.
 * implements {@link MLRemoteInputService}, for use with {@link ml-remote-input}
 *
 * Note: this style requires you to use the `controllerAs` syntax.
 *
 * <pre class="prettyprint">
 *   (function() {
 *     'use strict';
 *
 *     angular.module('app').controller('SearchCtrl', SearchCtrl);
 *
 *     SearchCtrl.$inject = ['$scope', '$location', 'MLSearchFactory', 'MLRemoteInputService'];
 *
 *     // inherit from MLRemoteSearchController
 *     var superCtrl = MLRemoteSearchController.prototype;
 *     SearchCtrl.prototype = Object.create(superCtrl);
 *
 *     function SearchCtrl($scope, $location, searchFactory, remoteInput) {
 *       var ctrl = this;
 *       var mlSearch = searchFactory.newContext();
 *
 *       MLRemoteSearchController.call(ctrl, $scope, $location, mlSearch, remoteInput);
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
 * @param {MLRemoteInputService} remoteInput - child controller's remoteInput instance
 *
 * @prop {MLRemoteInputService} remoteInput - child controller's remoteInput instance
 */

// inherit from MLSearchController
var superCtrl = MLSearchController.prototype;
MLRemoteSearchController.prototype = Object.create(superCtrl);

function MLRemoteSearchController($scope, $location, mlSearch, remoteInput) {
  'use strict';
  if ( !(this instanceof MLRemoteSearchController) ) {
    return new MLRemoteSearchController($scope, $location, mlSearch, remoteInput);
  }

  MLSearchController.call(this, $scope, $location, mlSearch);

  // TODO: error if not passed?
  this.remoteInput = remoteInput;
}

(function() {
  'use strict';

  /**
   * initialize the controller, wiring up the remote input service and invoking
   * {@link MLSearchController#init}
   *
   * @memberof MLRemoteSearchController
   * @return {Promise} the promise from {@link MLSearchContext#fromParams}
   */
  MLRemoteSearchController.prototype.init = function init() {
    // wire up remote input subscription
    var self = this;

    var unsubscribe = this.remoteInput.subscribe(function(input) {
      if (self.qtext !== input) {
        self.qtext = input;

        self.search.call(self);
      }
    });

    this.remoteInput.mlSearch = this.mlSearch;
    this.qtext = this.remoteInput.input;

    this.$scope.$on('$destroy', unsubscribe);

    return superCtrl.init.apply(this, arguments);
  };

  /**
   * update controller state by invoking {@link MLSearchController#updateSearchResults},
   * then pass the latest `qtext` to the remote input service
   *
   * @memberof MLRemoteSearchController
   * @param {Object} data - the response from {@link MLSearchContext#search}
   * @return {MLSearchController} `this`
   */
  MLRemoteSearchController.prototype.updateSearchResults = function updateSearchResults(data) {
    superCtrl.updateSearchResults.apply(this, arguments);
    // TODO: should this be on updateURLParams instead?
    this.remoteInput.setInput( this.qtext );
    return this;
  };

})();

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

(function() {

  'use strict';

  /**
   * angular attribute directive; parses ISO duration (`xs:duration`) strings.
   *
   * Transcludes markup, and creates a new scope with the following properties:
   *
   * - `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`
   * - `toString`: a function that returns the original text serialization of the duration
   *
   * see {@link ml-metrics} for an example
   *
   * @namespace ml-duration
   */
  angular.module('ml.search')
    .filter('duration', durationFilter)
    .directive('mlDuration', mlDuration);

  /**
   * angular filter; parses ISO duration (`xs:duration`) strings and creates a string description.
   *
   * Usage: `myduration | duration[:options]`
   *
   * For example, `"P3Y4M75DT23H31M14.54S" | duration` will produce:
   *   "3 years, 4 months, 75 days, 23 hours, 31 minutes, and 14.54 seconds"
   *
   * Duration properties that aren't present will be suppressed. You can provide translations through the options:
   *
   * ```
   * options = {
   *   year: 'year',
   *   years: 'years',
   *   month: 'month',
   *   months: 'months',
   *   week: 'week',
   *   weeks: 'weeks',
   *   day: 'day',
   *   days: 'days',
   *   hour: 'hour',
   *   hours: 'hours',
   *   minute: 'minute',
   *   minutes: 'minutes',
   *   second: 'second',
   *   seconds: 'seconds',
   * }
   * ```
   * @namespace duration
   */
  function durationFilter() {
    return function(duration, options) {
      duration = _.isObject( duration ) ? duration : parseDuration(duration);
      var result = [];
      var _options = {
        year: 'year',
        years: 'years',
        month: 'month',
        months: 'months',
        week: 'week',
        weeks: 'weeks',
        day: 'day',
        days: 'days',
        hour: 'hour',
        hours: 'hours',
        minute: 'minute',
        minutes: 'minutes',
        second: 'second',
        seconds: 'seconds',
      };

      angular.extend(_options, options);

      _.each(['year', 'month', 'week', 'day', 'hour', 'minute', 'second'], function(category) {
        var plural = category + 's';

        if ( duration[ plural ] ) {
          result.push(
            duration[ plural ] + ' ' +
            (duration[ plural ] > 1 ? _options[ plural ] : _options[ category ])
          );
        }
      });

      if (result.length > 1) {

        var last = result.splice(result.length - 1, 1);
        result = result.join(', ') + ', and ' + last[0];
        return result;

      } else {
        return result[0] || '0 seconds';
      }
    };
  }

  function mlDuration() {
    return {
      restrict: 'A',
      transclude: true,
      scope: { mlDuration: '=' },
      link: link
    };
  }

  function link($scope, element, attrs, ctrl, transclude) {
    $scope.$watch('mlDuration', function(newVal, oldVal) {
      if (newVal) {
        angular.extend($scope, {
          duration: parseDuration(newVal)
        });
      }
    });

    transclude($scope, function(clone) {
      element.append(clone);
    });
  }

  function parseDuration(duration) {
    // adapted from https://github.com/dordille/moment-isoduration
    var pattern = [
          'P(',
            '(([0-9]*\\.?[0-9]*)Y)?',
            '(([0-9]*\\.?[0-9]*)M)?',
            '(([0-9]*\\.?[0-9]*)W)?',
            '(([0-9]*\\.?[0-9]*)D)?',
          ')?',
          '(T',
            '(([0-9]*\\.?[0-9]*)H)?',
            '(([0-9]*\\.?[0-9]*)M)?',
            '(([0-9]*\\.?[0-9]*)S)?',
          ')?'
        ],
        regex = new RegExp(pattern.join('')),
        matches = duration.match(regex);

    return {
      years:   parseFloat(matches[3])  || null,
      months:  parseFloat(matches[5])  || null,
      weeks:   parseFloat(matches[7])  || null,
      days:    parseFloat(matches[9])  || null,
      hours:   parseFloat(matches[12]) || null,
      minutes: parseFloat(matches[14]) || null,
      seconds: parseFloat(matches[16]) || null,
      toString: function() {
        return duration;
      }
    };
  }

}());

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

(function() {

  'use strict';

  /**
   * angular element directive; a search-input form.
   *
   * attributes:
   *
   * - `qtext`: a reference to the model property containing the search phrase
   * - `search`: A function to trigger a search. Should invoke `mlSearch.search()`. ({@link MLSearchController#search})
   * - `suggest`: A function to get search phrase suggestions. Should invoke `mlSearch.suggest(qtext)`. ({@link MLSearchController#suggest})
   * - `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used. If `"fa"`, a bootstrap/font-awesome template will be used. **Note: the `"fa"` template _requires_ bootstrap 3.2.0 or greater.**
   *
   * Example:
   *
   * ```
   * <ml-input qtext="ctrl.qtext" search="ctrl.search(qtext)" suggest="ctrl.suggest(val)"></ml-input>```
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
        suggest: '&'
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
    } else {
      url = '/templates/ml-input.html';
    }

    return url;
  }

  function link($scope, element) {
    $scope.clear = function() {
      $scope.search({ qtext: '' });
    };
  }

}());

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

(function() {

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
   * <ml-results results="ctrl.response.results" link="ctrl.linkTarget(result)"></ml-results>```
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
        link: '&',
        label: '&'
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
      url = '/templates/ml-results.html';
    }

    return url;
  }

  function link(scope, element, attrs) {
    //default link fn
    if ( !attrs.link ) {
      scope.link = function(result) {
        // directive methods require objects
        return '/detail?uri=' + encodeURIComponent( result.result.uri );
      };
    }

    //default label fn
    if ( !attrs.label ) {
      scope.label = function(result) {
        // directive methods require objects
        return _.last( result.result.uri.split('/') );
      };
    }

    scope.$watch('results', function(newVal, oldVal) {
      _.each(newVal, function(result) {
        result.link = scope.link({ result: result });
        result.label = scope.label({ result: result });
      });
    });
  }

}());

(function() {

  'use strict';

  angular.module('ml.search')
    .service('MLRemoteInputService', MLRemoteInputService);

  MLRemoteInputService.$inject = ['$injector'];

  /**
   * @class MLRemoteInputService
   * @classdesc angular service for working with {@link ml-remote-input}
   *
   * @param {Object} $injector - angular dependency resolution service
   */
  function MLRemoteInputService($injector) {
    var service = this,
        $route = null;

    this.routeAvailable = true;

    try {
      $route = $injector.get('$route');
    } catch (ex) {
      this.routeAvailable = false;
    }

    service.input = '';
    service.mlSearch = null;
    service.callbacks = [];

    function unsubscribe(idx) {
      service.callbacks.splice(idx);
    }

    /**
     * sets the service.input instance property and invokes the registered callbacks
     * @method MLRemoteInputService#setInput
     *
     * @param {string} input
     */
    service.setInput = function setInput(input) {
      service.input = input;
      // TODO: Object.observe service.input?
      _.each(service.callbacks, function(callback) {
        callback(service.input);
      });
    };

    /**
     * registers a callback, returning a de-registration function
     * @method MLRemoteInputService#subscribe
     *
     * @param {function} callback - a callback to be invoked when `this.input` is changed
     * @return {function} callback de-registration function
     */
    service.subscribe = function subscribe(callback) {
      var idx = service.callbacks.length;
      service.callbacks.push(callback);
      return function() {
        unsubscribe(idx);
      };
    };

    /**
     * helper function for mlRemoteInput directive
     * registers and de-registers a callback that
     *   - updates the $scope parameter
     *   - updates the mlSearch parameter with the mlSearch instance property
     *     (if it exists)
     * @method MLRemoteInputService#initInput
     *
     * @param {object} $scope - search controller scope
     * @param {MLSearchContext} mlSearch - controller mlSearch instance
     */
    service.initInput = function initInput($scope, mlSearch) {
      var unsubscribe = service.subscribe(function(input) {
        $scope.qtext = input;
        mlSearch = service.mlSearch || mlSearch;
      });

      $scope.$on('destroy', unsubscribe);
    };

    /**
     * helper function for Search controller
     *
     * - registers and de-registers a callback that
     *   - updates the qtext property of the model parameter
     *   - invokes the searchCallback
     * - sets the mlSearch instance property
     * - initializes the qtext property of the model parameter
     *   (unless it's already set and the instance input property is not)
     *
     * @method MLRemoteInputService#initCtrl
     * @deprecated
     *
     * @param {object} $scope - search controller scope
     * @param {object} model - search controller model
     * @param {MLSearchContext} mlSearch - controller mlSearch instance
     * @param {function} searchCallback - search callback function
     */
    service.initCtrl = function initCtrl($scope, model, mlSearch, searchCallback) {
      var unsubscribe = service.subscribe(function(input) {
        if (model.qtext !== input) {
          model.qtext = input;

          searchCallback();
        }
      });

      $scope.$on('$destroy', unsubscribe);

      service.mlSearch = mlSearch;

      if ( model.qtext.length && !service.input.length ) {
        service.setInput( model.qtext );
      } else {
        model.qtext = service.input;
      }
    };

    /**
     * gets the path for a specified controller from the `$route` service (if available)
     * @method MLRemoteInputService#getPath
     *
     * @param {string} searchCtrl - search controller name
     * @return {?string} search controller path
     */
    service.getPath = function getPath(searchCtrl) {
      var route = { originalPath: '/' },
          matches = null;

      if ($route === null) {
        return null;
      }

      matches = _.where($route.routes, { controller: searchCtrl });

      if ( matches.length === 0 ) {
        // TODO: get route from attr, or throw Error('can\t find Search controller') ?
        console.error('can\'t find Search controller: ' + searchCtrl);
      } else {
        route = matches[0];

        if ( matches.length > 1 ) {
          console.log('multiple Search controller routes; choosing \'' +
                      route.originalPath + '\'');
        }
      }

      return route.originalPath;
    };

  }

}());

(function() {
  'use strict';

  // capture injected services for access throughout this module
  var $q = null,
      $location = null,
      mlRest = null,
      qb = null;

  angular.module('ml.search')
    .factory('MLSearchFactory', MLSearchFactory);

  MLSearchFactory.$inject = ['$q', '$location', 'MLRest', 'MLQueryBuilder'];

  /**
   * @class MLSearchFactory
   * @classdesc angular factory for creating instances of {@link MLSearchContext}
   *
   * @param {Object} $q - angular promise service
   * @param {Object} $location - angular location service
   * @param {MLRest} MLRest - low-level ML REST API wrapper (from {@link https://github.com/joemfb/ml-common-ng})
   * @param {MLQueryBuilder} MLQueryBuilder - structured query builder (from {@link https://github.com/joemfb/ml-common-ng})
   */
  // jscs:disable checkParamNames
  function MLSearchFactory($injectQ, $injectLocation, $injectMlRest, $injectQb) {
    $q = $injectQ;
    $location = $injectLocation;
    mlRest = $injectMlRest;
    qb = $injectQb;

    return {
      /**
       * returns a new instance of {@link MLSearchContext}
       * @method MLSearchFactory#newContext
       *
       * @param {Object} options (to override {@link MLSearchContext.defaults})
       * @returns {MLSearchContext}
       */
      newContext: function newContext(options) {
        return new MLSearchContext(options);
      }
    };
  }

  /**
   * @class MLSearchContext
   * @classdesc class for maintaining and manipulating the state of a search context
   *
   * @param {Object} options - provided object properties will override {@link MLSearchContext.defaults}
   *
   * @prop {MLQueryBuilder} qb - query builder service from `ml.common`
   * @prop {Object} results - search results
   * @prop {Object} storedOptions - cache stored search options by name
   * @prop {Object} activeFacets - active facet selections
   * @prop {Object} namespaces - namespace prefix-to-URI mappings
   * @prop {Object[]} boostQueries - boosting queries to be added to the current query
   * @prop {Object[]} additionalQueries - additional queries to be added to the current query
   * @prop {String} searchTransform - search results transformation name
   * @prop {String} qtext - current search phrase
   * @prop {Number} start - current pagination offset
   * @prop {Object} options - configuration options
   */
  function MLSearchContext(options) {
    this.qb = qb;
    this.results = {};
    this.storedOptions = {};
    this.activeFacets = {};
    this.namespaces = {};
    this.boostQueries = [];
    this.additionalQueries = [];
    this.searchTransform = null;
    this.qtext = null;
    this.start = 1;

    // TODO: validate options
    this.options = _.merge( _.cloneDeep(this.defaults), options );
  }

  angular.extend(MLSearchContext.prototype, {

    /************************************************************/
    /**************** MLSearchContext properties ****************/
    /************************************************************/

    /**
     * pass an object to `new MLSearchContext()` or {@link MLSearchFactory#newContext}
     * with any of these properties to override their values
     *
     * @type object
     * @memberof MLSearchContext
     * @static
     *
     * @prop {String} defaults.queryOptions - stored search options name (`'all'`)
     * @prop {String} defaults.suggestOptions - stored search options name for suggestions (`same as queryOptions`)
     * @prop {Number} defaults.pageLength - results page length (`10`)
     * @prop {String} defaults.snippet - results transform operator state-name (`'compact'`)
     * @prop {String} defaults.sort - sort operator state-name (`null`)
     * @prop {String} defaults.facetMode - determines if facets are combined in an `and-query` or an `or-query` (`and`)
     * @prop {Boolean} defaults.includeProperties - include document properties in queries (`false`)
     * @prop {Boolean} defaults.includeAggregates - automatically get aggregates for facets (`false`)
     * @prop {Object} defaults.params - URL params settings
     * @prop {String} defaults.params.separator - constraint-name and value separator (`':'`)
     * @prop {String} defaults.params.qtext - qtext parameter name (`'qtext'`)
     * @prop {String} defaults.params.facets - facets parameter name (`'f'`)
     * @prop {String} defaults.params.sort - sort parameter name (`'s'`)
     * @prop {String} defaults.params.page - page parameter name (`'p'`)
     * @prop {String} defaults.params.prefix - optional string prefix for each parameter name (`null`)
     * @prop {String} defaults.params.prefixSeparator - separator for prefix and parameter name. (`null`) <br>if `null`, `options.params.separator` is used as the prefix separator
     */
    defaults: {
      queryOptions: 'all',
      suggestOptions: null,
      pageLength: 10,
      snippet: 'compact',
      sort: null,
      facetMode: 'and',
      includeProperties: false,
      includeAggregates: false,
      params: {
        separator: ':',
        qtext: 'q',
        facets: 'f',
        negatedFacets: 'n',
        sort: 's',
        page: 'p',
        prefix: null,
        prefixSeparator: null
        //TODO: queryOptions?
      }
    },

    /************************************************************/
    /******** MLSearchContext instance getters/setters **********/
    /************************************************************/

    /**
     * Gets the object repesenting active facet selections
     * @method MLSearchContext#getActiveFacets
     *
     * @return {Object} `this.activeFacets`
     */
    getActiveFacets: function getActiveFacets() {
      return this.activeFacets;
    },

    /**
     * Get namspace prefix by URI
     * @method MLSearchContext#getNamespacePrefix
     *
     * @param {String} uri
     * @return {String} prefix
     */
    getNamespacePrefix: function getNamespacePrefix(uri) {
      return this.namespaces[ uri ];
    },

    /**
     * Get namspace URI by prefix
     * @method MLSearchContext#getNamespaceUri
     *
     * @param {String} prefix
     * @return {String} uri
     */
    getNamespaceUri: function getNamespacePrefix(prefix) {
      return _.chain(this.namespaces)
        .map(function(nsPrefix, uri) {
          if (prefix === nsPrefix) {
            return uri;
          }
        })
        .compact()
        .first()
        .value();
    },

    /**
     * Gets namespace prefix-to-URI mappings
     * @method MLSearchContext#getNamespaces
     *
     * @return {Object[]} namespace prefix-to-URI mapping objects
     */
    getNamespaces: function getNamespaces() {
      var namespaces = [];
      _.forIn(this.namespaces, function(prefix, uri) {
        namespaces.push({ prefix: prefix, uri: uri });
      });
      return namespaces;
    },

    /**
     * Sets namespace prefix->URI mappings
     * @method MLSearchContext#setNamespaces
     *
     * @param {Object[]} namespaces - objects with `uri` and `prefix` properties
     * @return {MLSearchContext} `this`
     */
    setNamespaces: function setNamespaces(namespaces) {
      // TODO: this.clearNamespaces() first?
      _.each(namespaces, this.addNamespace, this);
      return this;
    },

    /**
     * Adds a namespace prefix->URI mapping
     * @method MLSearchContext#addNamespace
     *
     * @param {Object} namespace object with `uri` and `prefix` properties
     * @return {MLSearchContext} `this`
     */
    addNamespace: function addNamespace(namespace) {
      this.namespaces[ namespace.uri ] = namespace.prefix;
      return this;
    },

    /**
     * Clears namespace prefix->URI mappings
     * @method MLSearchContext#clearNamespaces
     *
     * @return {MLSearchContext} `this`
     */
    clearNamespaces: function clearNamespaces() {
      this.namespaces = {};
      return this;
    },

    /**
     * Gets the boost queries
     * @method MLSearchContext#getBoostQueries
     *
     * @return {Array} `this.boostQueries`
     */
    getBoostQueries: function getBoostQueries() {
      return this.boostQueries;
    },

    /**
     * Adds a boost query to `this.boostQueries`
     * @method MLSearchContext#addBoostQuery
     *
     * @param {Object} query - boost query
     * @return {MLSearchContext} `this`
     */
    addBoostQuery: function addBoostQuery(query) {
      this.boostQueries.push(query);
      return this;
    },

    /**
     * Clears the boost queries
     * @method MLSearchContext#clearBoostQueries
     *
     * @return {MLSearchContext} `this`
     */
    clearBoostQueries: function clearBoostQueries() {
      this.boostQueries = [];
      return this;
    },

    /**
     * Gets the additional queries
     * @method MLSearchContext#getAdditionalQueries
     *
     * @return {Object} `this.additionalQueries`
     */
    getAdditionalQueries: function getAdditionalQueries() {
      return this.additionalQueries;
    },

    /**
     * Adds an additional query to `this.additionalQueries`
     * @method MLSearchContext#addAdditionalQuery
     *
     * @param {Object} query - additional query
     * @return {MLSearchContext} `this`
     */
    addAdditionalQuery: function addAdditionalQuery(query) {
      this.additionalQueries.push(query);
      return this;
    },

    /**
     * Clears the additional queries
     * @method MLSearchContext#clearAdditionalQueries
     *
     * @return {MLSearchContext} `this`
     */
    clearAdditionalQueries: function clearAdditionalQueries() {
      this.additionalQueries = [];
      return this;
    },

    /**
     * Gets the search transform name
     * @method MLSearchContext#getTransform
     *
     * @return {String} transform name
     */
    getTransform: function getTransform(transform) {
      return this.searchTransform;
    },

    /**
     * Sets the search transform name
     * @method MLSearchContext#setTransform
     *
     * @param {String} transform - transform name
     * @return {MLSearchContext} `this`
     */
    setTransform: function setTransform(transform) {
      this.searchTransform = transform;
      return this;
    },

    /**
     * Gets the current search phrase
     * @method MLSearchContext#getText
     *
     * @return {String} search phrase
     */
    getText: function getText() {
      return this.qtext;
    },

    /**
     * Sets the current search phrase
     * @method MLSearchContext#setText
     *
     * @param {String} text - search phrase
     * @return {MLSearchContext} `this`
     */
    setText: function setText(text) {
      if (text !== '') {
        this.qtext = text;
      } else {
        this.qtext = null;
      }
      return this;
    },

    /**
     * Gets the current search page
     * @method MLSearchContext#getPage
     *
     * @return {Number} search page
     */
    getPage: function getPage() {
      //TODO: $window.Math
      var page = Math.floor(this.start / this.options.pageLength) + 1;
      return page;
    },

    /**
     * Sets the search results page
     * @method MLSearchContext#setPage
     *
     * @param {Number} page - the desired search results page
     * @return {MLSearchContext} `this`
     */
    setPage: function setPage(page) {
      page = parseInt(page) || 1;
      this.start = 1 + (page - 1) * this.options.pageLength;
      return this;
    },

    /************************************************************/
    /********* MLSearchContext options getters/setters **********/
    /************************************************************/

    /**
     * Gets the current queryOptions (name of stored params)
     * @method MLSearchContext#getQueryOptions
     *
     * @return {String} queryOptions
     */
    getQueryOptions: function getQueryOptions() {
      return this.options.queryOptions;
    },

    /**
     * Gets the current suggestOptions (name of stored params for suggestions)
     * @method MLSearchContext#getSuggestOptions
     *
     * @return {String} suggestOptions
     */
    getSuggestOptions: function getSuggestOptions() {
      return this.options.suggestOptions;
    },

    /**
     * Gets the current page length
     * @method MLSearchContext#getPageLength
     *
     * @return {Number} page length
     */
    getPageLength: function getPageLength() {
      return this.options.pageLength;
    },

    /**
     * Sets the current page length
     * @method MLSearchContext#setPageLength
     *
     * @param {Number} pageLength - page length
     * @return {MLSearchContext} `this`
     */
    setPageLength: function setPageLength(pageLength) {
      this.options.pageLength = pageLength;
      return this;
    },

    /**
     * Gets the current results transform operator state name
     * @method MLSearchContext#getSnippet
     *
     * @return {String} operator state name
     */
    getSnippet: function getSnippet() {
      return this.options.snippet;
    },

    /**
     * Sets the current results transform operator state name
     * @method MLSearchContext#setSnippet
     *
     * @param {String} snippet - operator state name
     * @return {MLSearchContext} `this`
     */
    setSnippet: function setSnippet(snippet) {
      this.options.snippet = snippet;
      return this;
    },

    /**
     * Clears the results transform operator (resets it to its default value)
     * @method MLSearchContext#clearSnippet
     *
     * @return {MLSearchContext} `this`
     */
    clearSnippet: function clearSnippet() {
      this.options.snippet = this.defaults.snippet;
      return this;
    },

    /**
     * Gets the current sort operator state name
     * @method MLSearchContext#getSort
     *
     * @return {String} sort operator state name
     */
    getSort: function getSort() {
      return this.options.sort;
    },

    /**
     * Sets the current sort operator state name
     * @method MLSearchContext#setSort
     *
     * @param {String} sort - sort operator state name
     * @return {MLSearchContext} `this`
     */
    setSort: function setSort(sort) {
      this.options.sort = sort;
      return this;
    },

    /**
     * Clears the sort operator state name (resets it to its default value)
     * @method MLSearchContext#clearSort
     *
     * @return {MLSearchContext} `this`
     */
    clearSort: function clearSort() {
      this.options.sort = this.defaults.sort;
      return this;
    },

    /**
     * Gets the current facet mode (determines if facet values are combined in an `and-query` or an `or-query`)
     * @method MLSearchContext#getFacetMode
     *
     * @return {String} facet mode
     */
    getFacetMode: function getFacetMode() {
      return this.options.facetMode;
    },

    /**
     * Sets the current facet mode (`and`|`or`). (determines if facet values are combined in an `and-query` or an `or-query`)
     * @method MLSearchContext#setFacetMode
     *
     * @param {String} facetMode - 'and' or 'or'
     * @return {MLSearchContext} `this`
     */
    setFacetMode: function setFacetMode(facetMode) {
      //TODO: validate facetMode
      this.options.facetMode = facetMode;
      return this;
    },

    /**
     * Gets the current URL params config object
     * @method MLSearchContext#getParamsConfig
     *
     * @return {Object} params config
     */
    getParamsConfig: function getParamsConfig() {
      return this.options.params;
    },

    /**
     * Gets the key of the enabled URL params
     * @method MLSearchContext#getParamsKeys
     *
     * @return {Array<String>} URL params keys
     */
    getParamsKeys: function getParamsKeys() {
      var prefix = this.getParamsPrefix();
      return _.chain( this.options.params )
        .omit(['separator', 'prefix', 'prefixSeparator'])
        .map(function(value) {
          return prefix + value;
        })
        .compact()
        .value();
    },

    /**
     * Gets the URL params prefix
     * @method MLSearchContext#getParamsPrefix
     *
     * @return {String} the defined params prefix + separator
     */
    getParamsPrefix: function getParamsPrefix() {
      var prefix = '';

      if ( this.options.params.prefix !== null ) {
        prefix = this.options.params.prefix + (
                   this.options.params.prefixSeparator ||
                   this.options.params.separator
                 );
      }

      return prefix;
    },

    //TODO: setParamsConfig ?

    /************************************************************/
    /************** MLSearchContext query builders **************/
    /************************************************************/

    /**
     * Constructs a structured query from the current state
     * @method MLSearchContext#getQuery
     *
     * @return {Object} a structured query object
     */
    getQuery: function getQuery() {
      var query = qb.and();

      if ( _.keys(this.activeFacets).length ) {
        query = this.getFacetQuery();
      }

      if ( this.boostQueries.length ) {
        query = qb.boost(query, this.boostQueries);
      }

      if ( this.additionalQueries.length ) {
        query = qb.and(query, this.additionalQueries);
      }

      if ( this.options.includeProperties ) {
        query = qb.or(query, qb.propertiesFragment(query));
      }

      query = qb.where(query);

      if ( this.options.sort ) {
        // TODO: this assumes that the sort operator is called "sort", but
        // that isn't necessarily true. Properly done, we'd get the options
        // from the server and find the operator that contains sort-order
        // elements
        query.query.queries.push( qb.ext.operatorState('sort', this.options.sort) );
      }

      if ( this.options.snippet ) {
        // same problem as `sort`
        query.query.queries.push( qb.ext.operatorState('results', this.options.snippet) );
      }

      return query;
    },

    /**
     * constructs a structured query from the current active facets
     * @method MLSearchContext#getFacetQuery
     *
     * @return {Object} a structured query object
     */
    getFacetQuery: function getFacetQuery() {
      var self = this,
          queries = [],
          query = {},
          constraintFn;

      _.forIn( self.activeFacets, function(facet, facetName) {
        if ( facet.values.length ) {
          constraintFn = function(facetValueObject) {
            var constraintQuery = qb.ext.constraint( facet.type )( facetName, facetValueObject.value );
            if (facetValueObject.negated === true) {
              constraintQuery = qb.not(constraintQuery);
            }
            return constraintQuery;
          };

          queries = queries.concat( _.map(facet.values, constraintFn) );
        }
      });

      if ( self.options.facetMode === 'or' ) {
        query = qb.or(queries);
      } else {
        query = qb.and(queries);
      }

      return query;
    },

    /**
     * Construct a combined query from the current state (excluding stored options)
     * @method MLSearchContext#getCombinedQuerySync
     *
     * @param {Object} [options] - optional search options object
     *
     * @return {Object} - combined query
     */
    getCombinedQuerySync: function getCombinedQuerySync(options) {
      return qb.ext.combined( this.getQuery(), this.getText(), options );
    },

    /**
     * Construct a combined query from the current state
     * @method MLSearchContext#getCombinedQuery
     *
     * @param {Boolean} [includeOptions] - if `true`, get and include the stored search options (defaults to `false`)
     *
     * @return {Promise} - a promise resolved with the combined query
     */
    getCombinedQuery: function getCombinedQuery(includeOptions) {
      var combined = this.getCombinedQuerySync();

      if ( !includeOptions ) {
        return $q.resolve(combined);
      }

      return this.getStoredOptions()
      .then(function(data) {
        combined.search.options = data.options;
        return combined;
      });
    },

    /************************************************************/
    /************** MLSearchContext facet methods ***************/
    /************************************************************/

    /**
     * Check if the facet/value combination is already selected
     * @method MLSearchContext#isFacetActive
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @return {Boolean} isSelected
     */
    isFacetActive: function isFacetActive(name, value) {
      var active = this.activeFacets[name];
      return !!active && !!_.find(active.values, { value: value });
    },

    /**
     * Check if the facet/value combination selected & negated
     * @method MLSearchContext#isFacetNegated
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @return {Boolean} isNegated
     */
    isFacetNegated: function isFacetNegated(name, value) {
      var active = this.activeFacets[name];

      if (!active) {
        return false;
      }
      var facet = _.find(active.values, { value: value });

      if (!!facet) {
        return facet.negated;
      } else {
        return false;
      }
    },

    /**
     * Add the facet/value/type combination to the activeFacets list
     * @method MLSearchContext#selectFacet
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @param {String} type - facet type
     * @param {Boolean} isNegated - facet negated (default to false)
     * @return {MLSearchContext} `this`
     */
    selectFacet: function selectFacet(name, value, type, isNegated) {
      if (/^"(.*)"$/.test(value)) {
        value = value.replace(/^"(.*)"$/, '$1');
      }
      var active = this.activeFacets[name],
          negated = isNegated || false,
          valueObject = { value: value, negated: negated };

      if (active && !this.isFacetActive(name, value) ) {
        active.values.push(valueObject);
      } else {
        this.activeFacets[name] = { type: type, values: [valueObject] };
      }

      return this;
    },

    /**
     * Removes the facet/value combination from the activeFacets list
     * @method MLSearchContext#clearFacet
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @return {MLSearchContext} `this`
     */
    clearFacet: function clearFacet(name, value) {
      var active = this.activeFacets[name];

      active.values = _.filter( active.values, function(facetValueObject) {
        return facetValueObject.value !== value;
      });

      if ( !active.values.length ) {
        delete this.activeFacets[name];
      }

      return this;
    },

    /**
     * If facet/value combination is active, remove it from the activeFacets list
     *   otherwise, find it's type, and add it.
     * @method MLSearchContext#toggleFacet
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @param {Boolean} isNegated - facet negated
     * @return {MLSearchContext} `this`
     */
    toggleFacet: function toggleFacet(name, value, isNegated) {
      var config;

      if ( this.isFacetActive(name, value) ) {
        this.clearFacet(name, value);
      } else {
        config = this.getFacetConfig(name);

        this.selectFacet(name, value, config.type, isNegated);
      }

      return this;
    },

    /**
     * Clears the activeFacets list
     * @method MLSearchContext#clearAllFacets
     *
     * @return {MLSearchContext} `this`
     */
    clearAllFacets: function clearAllFacets() {
      this.activeFacets = {};
      return this;
    },

    /**
     * Retrieve additional values for the provided `facet` object,
     * appending them to the facet's `facetValues` array. Sets `facet.displayingAll = true`
     * once no more values are available.
     *
     * @method MLSearchContext#showMoreFacets
     *
     * @param {Object} facet - a facet object returned from {@link MLSearchContext#search}
     * @param {String} facetName - facet name
     * @param {Number} [step] - the number of additional facet values to retrieve (defaults to `5`)
     *
     * @return {Promise} a promise resolved once additional facets have been retrieved
     */
    showMoreFacets: function showMoreFacets(facet, facetName, step) {
      step = step || 5;

      var start = facet.facetValues.length + 1,
          limit = start + step - 1;

      return this.valuesFromConstraint(facetName, { start: start, limit: limit })
      .then(function(resp) {
        var newFacets = resp && resp['values-response'] && resp['values-response']['distinct-value'];

        facet.displayingAll = (!newFacets || newFacets.length < (limit - start));

        _.each(newFacets, function(newFacetValue) {
          facet.facetValues.push({
            name: newFacetValue._value,
            value: newFacetValue._value,
            count: newFacetValue.frequency
          });
        });

        return facet;
      });
    },

    /************************************************************/
    /************ MLSearchContext URL params methods ************/
    /************************************************************/

    /**
     * Construct a URL query params object from the current state
     * @method MLSearchContext#getParams
     *
     * @return {Object} params - a URL query params object
     */
    getParams: function getParams() {
      var page = this.getPage(),
          facetParams = this.getFacetParams(),
          facets = facetParams.facets,
          negated = facetParams.negatedFacets,
          params = {},
          prefix = this.getParamsPrefix();

      if ( facets.length && this.options.params.facets !== null ) {
        params[ prefix + this.options.params.facets ] = facets;
      }

      if ( negated.length && this.options.params.negatedFacets !== null ) {
        params[ prefix + this.options.params.negatedFacets ] = negated;
      }

      if ( page > 1 && this.options.params.page !== null ) {
        params[ prefix + this.options.params.page ] = page;
      }

      if ( this.qtext && this.options.params.qtext !== null ) {
        params[ prefix + this.options.params.qtext ] = this.qtext;
      }

      if ( this.options.sort && this.options.params.sort !== null ) {
        params[ prefix + this.options.params.sort ] = this.options.sort;
      }

      return params;
    },

    /**
     * Construct an array of facet selections (`name` `separator` `value`) from `this.activeFacets` for use in a URL query params object
     * @method MLSearchContext#getFacetParams
     *
     * @return {Array<String>} an array of facet URL query param values
     */
    getFacetParams: function getFacetParams() {
      var self = this,
          facetQuery = self.getFacetQuery(),
          queries = [],
          facets = { facets: [], negatedFacets: [] };

      queries = ( facetQuery['or-query'] || facetQuery['and-query'] ).queries;
      _.each(queries, function(query) {
        var queryType = _.keys(query)[0],
            constraint,
            name,
            arrayToPushTo;

        if (queryType === 'not-query') {
          constraint = query[queryType][_.keys(query[queryType])[0]];
          arrayToPushTo = facets.negatedFacets;
        } else {
          constraint = query[ queryType ];
          arrayToPushTo = facets.facets;
        }

        name = constraint['constraint-name'];

        _.each( constraint.value || constraint.uri, function(value) {
          // quote values with spaces
          if (/\s+/.test(value) && !/^"(.*)"$/.test(value)) {
            value = '"' + value + '"';
          }
          arrayToPushTo.push( name + self.options.params.separator + value );
        });
      });

      return facets;
    },

    /**
     * Gets the current search related URL params (excluding any params not controlled by {@link MLSearchContext})
     * @method MLSearchContext#getCurrentParams
     *
     * @param {Object} [params] - URL params (defaults to `$location.search()`)
     * @return {Object} search-related URL params
     */
    getCurrentParams: function getCurrentParams(params) {
      var prefix = this.getParamsPrefix();

      params = _.pick(
        params || $location.search(),
        this.getParamsKeys()
      );

      _.chain(this.options.params)
      .pick(['facets', 'negatedFacets'])
      .values()
      .each(function(key) {
        var name = prefix + key;

        if ( params[ name ] ) {
          params[ name ] = asArray(params[ name ]);
        }
      })
      .value();

      return params;
    },

    /**
     * Updates the current state based on the URL query params
     * @method MLSearchContext#fromParams
     *
     * @param {Object} [params] - a URL query params object (defaults to `$location.search()`)
     * @return {Promise} a promise resolved once the params have been applied
     */
    fromParams: function fromParams(params) {
      var self = this,
          paramsConf = this.options.params,
          facets = null,
          negatedFacets = null,
          optionPromise = null;

      params = this.getCurrentParams( params );

      this.fromParam( paramsConf.qtext, params,
        this.setText.bind(this),
        this.setText.bind(this, null)
      );

      this.fromParam( paramsConf.page, params,
        this.setPage.bind(this),
        this.setPage.bind(this, 1)
      );

      this.fromParam( paramsConf.sort, params,
        this.setSort.bind(this)
      );

      self.clearAllFacets();

      // _.identity returns it's argument, fromParam returns the callback result
      facets = this.fromParam( paramsConf.facets, params, _.identity );
      negatedFacets = this.fromParam( paramsConf.negatedFacets, params, _.identity );

      if ( !(facets || negatedFacets) ) {
        return $q.resolve();
      }

      // if facet type information is available, options can be undefined
      optionPromise = !!self.results.facets ?
                      $q.resolve(undefined) :
                      self.getStoredOptions();

      return optionPromise.then(function(options) {
        if ( facets ) {
          self.fromFacetParam(facets, options);
        }

        if ( negatedFacets ) {
          self.fromFacetParam(negatedFacets, options, true);
        }
      });
    },

    /**
     * Get the value for the given type of URL param, handling prefixes
     * @method MLSearchContext#fromParam
     * @private
     *
     * @param {String} name - URL param name
     * @param {Object} params - URL params
     * @param {Function} callback - callback invoked with the value of the URL param
     * @param {Function} defaultCallback - callback invoked if params are un-prefix'd and no value is provided
     */
    fromParam: function fromParam(name, params, callback, defaultCallback) {
      var prefixedName = this.getParamsPrefix() + name,
          value = params[ prefixedName ];

      if ( name === null ) {
        return;
      }

      if ( !value ) {
        if ( defaultCallback ) {
          defaultCallback.call(this);
        }
        return;
      }

      if ( _.isString(value) ) {
        value = decodeParam(value);
      }

      return callback.call( this, value );
    },

    /**
     * Updates the current active facets based on the provided facet URL query params
     * @method MLSearchContext#fromFacetParam
     * @private
     *
     * @param {Array|String} param - facet URL query params
     * @param {Object} [storedOptions] - a searchOptions object
     * @param {Boolean} isNegated - whether the facet should be negated (defaults to false)
     */
    fromFacetParam: function fromFacetParam(param, storedOptions, isNegated) {
      var self = this,
          values = _.map( asArray(param), decodeParam ),
          negated = isNegated || false;

      _.each(values, function(value) {
        var tokens = value.split( self.options.params.separator ),
            facetName = tokens[0],
            facetValue = tokens[1],
            facetInfo = self.getFacetConfig( facetName, storedOptions ) || {};

        if ( !facetInfo.type ) {
          console.error('don\'t have facets or options for \'' + facetName +
                        '\', falling back to un-typed range queries');
        }

        self.selectFacet( facetName, facetValue, facetInfo.type, negated );
      });
    },

    /**
     * Gets the "facet config": either a facet response or a constraint definition object
     *
     * (this function is called in a tight loop, so loading the options async won't work)
     *
     * @method MLSearchContext#getFacetConfig
     * @private
     *
     * @param {String} name - facet name
     * @param {Object} [storedOptions] - a searchOptions object
     * @return {Object} facet config
     */
    getFacetConfig: function getFacetConfig(name, storedOptions) {
      var config = null;

      if ( !!storedOptions ) {
        config = _.chain( storedOptions.options.constraint )
          .where({ name: name })
          .first()
          .clone()
          .value();

        config.type = config.collection ? 'collection' :
                      config.custom ? 'custom' :
                      config.range.type;
      } else if ( !!this.results.facets && this.results.facets[ name ] ) {
        config = this.results.facets[ name ];
      }

      return config;
    },

    /**
     * Examines the current state, and determines if a new search is needed.
     *   (intended to be triggered on `$locationChangeSuccess`)
     * @method MLSearchContext#locationChange
     *
     * @param {String} newUrl - the target URL of a location change
     * @param {String} oldUrl - the original URL of a location change
     * @param {Object} params - the search params of the target URL
     *
     * @return {Promise} a promise resolved after calling {@link MLSearchContext#fromParams} (if a new search is needed)
     */
    locationChange: function locationChange(newUrl, oldUrl, params) {
      params = this.getCurrentParams( params );

      // still on the search page, but there's a new query
      var shouldUpdate = pathsEqual(newUrl, oldUrl) &&
                         !_.isEqual( this.getParams(), params );

      if ( !shouldUpdate ) {
        return $q.reject();
      }

      return this.fromParams(params);
    },

    /************************************************************/
    /********** MLSearchContext data retrieval methods **********/
    /************************************************************/

    /**
     * Retrieves stored search options, caching the result in `this.storedOptions`
     * @method MLSearchContext#getStoredOptions
     *
     * @param {String} [name] - the name of the options to retrieve (defaults to `this.getQueryOptions()`)
     * @return {Promise} a promise resolved with the stored options
     */
    getStoredOptions: function getStoredOptions(name) {
      var self = this;

      name = name || this.getQueryOptions();

      if ( this.storedOptions[name] ) {
        return $q.resolve( this.storedOptions[name] );
      }

      return mlRest.queryConfig(name)
      .then(function(response) {
        //TODO: transform?
        self.storedOptions[name] = response.data;
        return self.storedOptions[name];
      });
    },

    /**
     * Retrieves stored search options, caching the result in `this.storedOptions`
     * @method MLSearchContext#getAllStoredOptions
     *
     * @param {String[]} names - the names of the options to retrieve
     * @return {Promise} a promise resolved with an object containing the requested search options, keyed by name
     */
    getAllStoredOptions: function getAllStoredOptions(names) {
      var self = this,
          result = {};

      // cache any options not already loaded
      return $q.all( _.map(names, self.getStoredOptions.bind(self)) ).then(function() {
        // return only the names requested
        _.each(names, function(name) {
          result[name] = self.storedOptions[name];
        });
        return result;
      });
    },

    /**
     * Retrieves search phrase suggestions based on the current state
     * @method MLSearchContext#suggest
     *
     * @param {String} qtext - the partial-phrase to match
     * @param {String|Object} [options] - string options name (to override suggestOptions), or object for adhoc combined query options
     * @return {Promise} a promise resolved with search phrase suggestions
     */
    suggest: function suggest(qtext, options) {
      var params = {
        'partial-q': qtext,
        format: 'json',
        options: (_.isString(options) && options) || this.getSuggestOptions() || this.getQueryOptions()
      };

      var combined = this.getCombinedQuerySync();

      if ( _.isObject(options) ) {
        combined.search.options = options;
      }

      return mlRest.suggest(params, combined)
      .then(function(response) {
        return response.data;
      });
    },

    /**
     * Retrieves values from a lexicon (based on a constraint definition)
     * @method MLSearchContext#valuesFromConstraint
     *
     * @param {String} name - the name of a search `constraint` definition
     * @param {Object} [params] - URL params
     * @return {Promise} a promise resolved with values
     */
    valuesFromConstraint: function valuesFromConstraint(name, params) {
      var self = this;

      return this.getStoredOptions()
      .then(function(storedOptions) {
        var constraint = getConstraint(storedOptions, name);

        if ( !constraint ) {
          return $q.reject(new Error('No constraint exists matching ' + name));
        }

        if ( constraint.range && constraint.range.bucket ) {
          return $q.reject(new Error('Can\'t get values for bucketed constraint ' + name));
        }

        var newOptions = valueOptionsFromConstraint(constraint);

        return self.values(name, params, newOptions);
      });
    },

    /**
     * Retrieves values or tuples from 1-or-more lexicons
     * @method MLSearchContext#values
     *
     * @param {String} name - the name of a `value-option` definition
     * @param {Object} [params] - URL params
     * @param {Object} [options] - search options, used in a combined query
     * @return {Promise} a promise resolved with values
     */
    values: function values(name, params, options) {
      var self = this,
          combined = this.getCombinedQuerySync();

      if ( !options && params && params.options && !(params.start || params.limit) ) {
        options = params;
        params = null;
      }

      params = params || {};
      params.start = params.start !== undefined ? params.start : 1;
      params.limit = params.limit !== undefined ? params.limit : 20;
      params.options = self.getQueryOptions();

      if ( _.isObject(options) ) {
        combined.search.options = options;
      }

      return mlRest.values(name, params, combined)
      .then(function(response) {
        return response.data;
      });
    },

    /**
     * Retrieves search results based on the current state
     *
     * If an object is passed as the `adhoc` parameter, the search will be run as a `POST`
     * with a combined query, and the results will not be saved to `MLSearchContext.results`.
     * If `adhoc` is a combined query, or a search options object, the `options` URL parameter
     * will not be included (ignoring stored search options).
     *
     * @method MLSearchContext#search
     *
     * @param {Object} [adhoc] - structured query || combined query || partial search options object
     * @return {Promise} a promise resolved with search results
     */
    search: function search(adhoc) {
      var self = this,
          combined = null,
          includeOptionsParam = true,
          params = {
            start: this.start,
            pageLength: this.options.pageLength,
            transform: this.searchTransform
          };

      if ( adhoc ) {
        combined = this.getCombinedQuerySync();

        if ( adhoc.search ) {
          includeOptionsParam = false;
          combined.search = adhoc.search;
        } else if ( adhoc.options ) {
          includeOptionsParam = false;
          combined.search.options = adhoc.options;
        } else if ( adhoc.query ) {
          combined.search.query = adhoc.query;
        } else {
          combined.search.options = adhoc;
        }
      } else {
        params.structuredQuery = this.getQuery();
        params.q = this.getText();
      }

      if ( includeOptionsParam ) {
        params.options = this.getQueryOptions();
      }

      return mlRest.search(params, combined)
      .then(function(response) {
        var results = response.data;

        // the results of adhoc queries aren't preserved
        if ( !combined ) {
          self.results = results;
        }

        self.transformMetadata(results.results);
        self.annotateActiveFacets(results.facets);

        if (self.options.includeAggregates) {
          return self.getAggregates(results.facets)
          .then(function() {
            return results;
          });
        }

        return results;
      });
    },

    /**
     * Annotates facets (from a search response object) with the selections from `this.activeFacets`
     * @method MLSearchContext#annotateActiveFacets
     *
     * @param {Object} facets - facets object from a search response
     */
    annotateActiveFacets: function annotateActiveFacets(facets) {
      var self = this;

      _.forIn( facets, function(facet, name) {
        var selected = self.activeFacets[name];

        if ( selected ) {
          _.chain(facet.facetValues)
            .filter(function(value) {
              return self.isFacetActive(name, value.name);
            })
            .each(function(value) {
              facet.selected = value.selected = true;
              value.negated = self.isFacetNegated(name, value.name);
            })
            .value(); // thwart lazy evaluation
        }

        if ( facet.type === 'bucketed' ) {
          facet.displayingAll = true;
        }
      });
    },

    /**
     * Gets aggregates for facets (from a search response object) based on facet type
     * @method MLSearchContext#getAggregates
     *
     * @param {Object} facets - facets object from a search response
     * @return {Promise} a promise resolved once facet aggregates have been retrieved
     */
    getAggregates: function getAggregates(facets) {
      var self = this;

      return self.getStoredOptions()
      .then(function(storedOptions) {
        var promises = [];

        try {
          _.forIn( facets, function(facet, facetName) {
            var facetType = facet.type,
                constraint = getConstraint(storedOptions, facetName);

            if ( !constraint ) {
              throw new Error('No constraint exists matching ' + facetName);
            }

            var newOptions = valueOptionsFromConstraint(constraint);

            // TODO: update facetType from constraint ?
            // TODO: make the choice of aggregates configurable

            // these work for all index types
            newOptions.values.aggregate = [
              { apply: 'count' },
              { apply: 'min' },
              { apply: 'max' }
            ];

            // TODO: move the scalar-type -> aggregate mappings to MLRest (see https://gist.github.com/joemfb/b682504c7c19cd6fae11)

            var numberTypes = [
              'xs:int',
              'xs:unsignedInt',
              'xs:long',
              'xs:unsignedLong',
              'xs:float',
              'xs:double',
              'xs:decimal'
            ];

            if ( _.contains(numberTypes, facetType) ) {

              newOptions.values.aggregate = newOptions.values.aggregate.concat([
                { apply: 'sum' },
                { apply: 'avg' },
                // TODO: allow enabling these from config?
                // { apply: 'median' },
                // { apply: 'stddev' },
                // { apply: 'stddev-population' },
                // { apply: 'variance' },
                // { apply: 'variance-population' }
              ]);

            }

            promises.push(
              self.values(facetName, { start: 1, limit: 0 }, newOptions)
              .then(function(resp) {
                var aggregates = resp && resp['values-response'] && resp['values-response']['aggregate-result'];

                _.each( aggregates, function(aggregate) {
                  facet[aggregate.name] = aggregate._value;
                });
              })
            );
          });
        }
        catch (err) {
          return $q.reject(err);
        }

        return $q.all(promises);
      });
    },

    /**
     * Transforms the metadata array in each search response result object to an object, key'd by `metadata-type`
     * @method MLSearchContext#transformMetadata
     *
     * @param {Object} result - results array from a search response (or one result object from the array)
     */
    transformMetadata: function transformMetadata(result) {
      var self = this,
          metadata;

      if ( _.isArray(result) ) {
        _.each(result, this.transformMetadata, self);
        return;
      }

      metadata = result.metadata;
      result.metadata = {};

      _.each(metadata, function(obj) {
        var key = _.without(_.keys(obj), 'metadata-type')[0],
            type = obj[ 'metadata-type' ],
            value = obj[ key ],
            shortKey = null,
            prefix = null,
            ns = null;

        ns = key.replace(/^\{([^}]+)\}.*$/, '$1');
        prefix = self.getNamespacePrefix(ns);

        if ( prefix ) {
          shortKey = key.replace(/\{[^}]+\}/, prefix + ':');
        } else {
          shortKey = key;
        }

        if ( !result.metadata[ shortKey ] ) {
          result.metadata[ shortKey ] = { 'metadata-type': type, values: [] };
        }

        result.metadata[ shortKey ].values.push(value);
      });
    },

    /**
     * @method MLSearchContext#getStructuredQuery
     * @deprecated
     *
     * @see MLSearchContext#getQuery
     */
    getStructuredQuery: function getStructuredQuery() {
      console.log(
        'Warning, MLSearchContext.getStructuredQuery is deprecated, and will be removed in the next release!\n' +
        'Use MLSearchContext.getQuery in it\'s place'
      );
      return this.getQuery.apply(this, arguments);
    },

    /**
     * @method MLSearchContext#serializeStructuredQuery
     * @deprecated
     *
     * @see MLSearchContext#getParams
     */
    serializeStructuredQuery: function serializeStructuredQuery() {
      console.log(
        'Warning, MLSearchContext.serializeStructuredQuery is deprecated, and will be removed in the next release!\n' +
        'Use MLSearchContext.getParams in it\'s place'
      );
      return this.getParams.apply(this, arguments);
    }

  });

  function decodeParam(value) {
    return decodeURIComponent(value.replace(/\+/g, '%20'));
  }

  function pathsEqual(newUrl, oldUrl) {
    // TODO: use $$urlUtils.urlResolve(), once it's available
    // see: https://github.com/angular/angular.js/pull/3302
    // from: https://stackoverflow.com/questions/21516891
    function pathName(href) {
      var x = document.createElement('a');
      x.href = href;
      return x.pathname;
    }

    return pathName(newUrl) === pathName(oldUrl);
  }

  function getConstraint(storedOptions, name) {
    return storedOptions && storedOptions.options && storedOptions.options.constraint &&
           _.where(asArray(storedOptions.options.constraint), { name: name })[0];
  }

  function valueOptionsFromConstraint(constraint) {
    var options = { constraint: asArray(constraint), values: asArray(_.cloneDeep(constraint)) };
    options.values[0]['values-option'] = constraint.range && constraint.range['facet-option'];
    return options;
  }

  //TODO: move to util module
  function asArray() {
    var args;

    /* istanbul ignore else */
    if ( arguments.length === 1) {
      if (Array.isArray( arguments[0] )) {
        args = arguments[0];
      } else {
        args = [ arguments[0] ];
      }
    } else {
      args = [].slice.call(arguments);
    }

    return args;
  }

})();

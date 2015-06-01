(function () {

  'use strict';

  angular.module('ml.search', ['ml.common'])
    .filter('object2Array', object2Array)
    .filter('truncate', truncate);

  function object2Array() {
    return function(input) {
      var out = [];
      for (var name in input) {
        input[name].__key = name;
        out.push(input[name]);
      }
      return out;
    };
  }

  function truncate() {
    return function (text, length, end) {
      length = length || 10;
      end = end || '...';

      return (text.length > length) ?
             String(text).substring(0, length - end.length) + end :
             text;
    };
  }

}());

(function () {

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
    .directive('mlDuration', mlDuration);

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
    }
    else {
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

(function () {

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
   * <ml-metrics search="model.search"></ml-metrics>```
   *
   * Transclusion Example:
   *
   * ```
   * <ml-metrics search="model.search">
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

(function () {

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
   * In the controller:
   *
   * ```javascript
   * remoteInput.initCtrl($scope, model, mlSearch, search);```
   *
   * Note: this function assumes `mlSearch` is an instance of {@link MLSearchContext}, `search` is a function, and `model` has a `qtext` property. If these assumptions don't hold, a more verbose approach is required:
   *
   * `// TODO: complex example`
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

(function () {

  'use strict';

  angular.module('ml.search')
    .service('MLRemoteInputService', MLRemoteInputService);

  MLRemoteInputService.$inject = ['$injector'];

  /**
   * @class MLRemoteInputService
   * @classdesc angular service for working with {@link ml-remote-input}
   */
  function MLRemoteInputService($injector) {
    var service = this;
    var $route = null;

    try {
      $route = $injector.get('$route');
    } catch (ex) {
      console.log('ngRoute unavailable');
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
    service.setInput = function setInput(val) {
      service.input = val;
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
     * @method MLRemoteInputService#initCtrl
     *
     * @param {object} $scope - search controller scope
     * @param {object} model - search controller model
     * @param {MLSearchContext} mlSearch - controller mlSearch instance
     * @param {function} search callback
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
     * @return {string} search controller path
     */
    service.getPath = function getPath(searchCtrl) {
      var route = { originalPath: '/' },
          matches = null;

      if ($route === null) return null;

      matches = _.where($route.routes, { controller: searchCtrl });

      if ( matches.length === 0 ) {
        // TODO: get route from attr, or throw Error('can\t find Search controller') ?
        console.error('can\t find Search controller: ' + searchCtrl);
      }
      else {
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

(function () {
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
   */
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
       * @param {Object} options
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
   * @param {Object} options - provided object properties will override defaults
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
     * @prop {String} defaults.queryOptions - stored search options name ('all')
     * @prop {Number} defaults.pageLength - results page length (10)
     * @prop {String} defaults.snippet - results transform operator state-name ('compact')
     * @prop {String} defaults.sort - sort operator state-name (null)
     * @prop {String} defaults.facetMode - combine facets with an `and-query` or an `or-query` ('and')
     * @prop {Boolean} defaults.includeProperties - include document properties in queries (false)
     * @prop {Object} defaults.params - URL params settings
     * @prop {String} defaults.params.separator - constraint-name and value separator (':')
     * @prop {String} defaults.params.qtext - qtext parameter name ('qtext')
     * @prop {String} defaults.params.facets - facets parameter name ('f')
     * @prop {String} defaults.params.sort - sort parameter name ('s')
     * @prop {String} defaults.params.page - page parameter name ('p')
     */
    defaults: {
      queryOptions: 'all',
      pageLength: 10,
      snippet: 'compact',
      sort: null,
      facetMode: 'and',
      includeProperties: false,
      params: {
        separator: ':',
        qtext: 'q',
        facets: 'f',
        sort: 's',
        page: 'p'
        //TODO: queryOptions?
      }
    },

    /************************************************************/
    /******** MLSearchContext instance getters/setters **********/
    /************************************************************/

    /**
     * Gets the hash of active facets
     * @method MLSearchContext#getActiveFacets
     *
     * @return {MLSearchContext} `this`.activeFacets
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
        .valueOf()[0];
    },

    /**
     * Gets namespace prefix-to-URI mapping objects
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
     * Sets namespace objects
     * @method MLSearchContext#setNamespaces
     *
     * @param {Object[]} namespace objects
     * @return {MLSearchContext} `this`
     */
    setNamespaces: function setNamespaces(namespaces) {
      _.each(namespaces, this.addNamespace, this);
      return this;
    },

    /**
     * Adds a namespace object
     * @method MLSearchContext#addNamespace
     *
     * @param {Object} namespace
     * @return {MLSearchContext} `this`
     */
    addNamespace: function addNamespace(namespace) {
      this.namespaces[ namespace.uri ] = namespace.prefix;
      return this;
    },

    /**
     * Clears namespaces
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
     * @return {MLSearchContext} `this`.activeFacets
     */
    getBoostQueries: function getBoostQueries() {
      return this.boostQueries;
    },

    /**
     * Adds a boost query
     * @method MLSearchContext#addBoostQuery
     *
     * @param {Object} boost query
     * @return {MLSearchContext} `this`
     */
    addBoostQuery: function addBoostQuery(query) {
      this.boostQueries.push(query);
      return this;
    },

    /**
     * Clear the boost queries
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
     * @return {MLSearchContext} `this`.additionalQueries
     */
    getAdditionalQueries: function getAdditionalQueries() {
      return this.additionalQueries;
    },

    /**
     * Adds a additional query
     * @method MLSearchContext#addAdditionalQuery
     *
     * @param {Object} additional query
     * @return {MLSearchContext} `this`
     */
    addAdditionalQuery: function addAdditionalQuery(query) {
      this.additionalQueries.push(query);
      return this;
    },

    /**
     * Clear the additional queries
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
     * @param {String} transform name
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
     * @param {String} search phrase
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
     * @param {Number} search - the desired search results page
     * @return {MLSearchContext} `this`
     */
    setPage: function setPage(page) {
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

    //TODO: setQueryOptions ?

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
     * @param {Number} page length
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
     * @param {String} operator state name
     * @return {MLSearchContext} `this`
     */
    setSnippet: function setSnippet(snippet) {
      this.options.snippet = snippet;
      return this;
    },

    /**
     * Resets the current results transform operator state name to its default value
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
     * @param {String} sort operator state name
     * @return {MLSearchContext} `this`
     */
    setSort: function setSort(sort) {
      this.options.sort = sort;
      return this;
    },

    /**
     * Resets the current sort operator state name to its default value
     * @method MLSearchContext#clearSort
     *
     * @return {MLSearchContext} `this`
     */
    clearSort: function clearSort() {
      this.options.sort = this.defaults.sort;
      return this;
    },

    /**
     * Gets the current facet mode name (and|or)
     * @method MLSearchContext#getFacetMode
     *
     * @return {String} facet mode
     */
    getFacetMode: function getFacetMode() {
      return this.options.facetMode;
    },

    /**
     * Sets the current facet mode name. The facet mode determines the query used to join facet selections:
     * `and-query` or `or-query`.
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
     * @return {String} facet mode
     */
    getParamsConfig: function getParamsConfig() {
      return this.options.params;
    },

    //TODO: setParamsConfig ?

    /************************************************************/
    /************** MLSearchContext query builders **************/
    /************************************************************/

    /**
     * Constructs a structured query from the current state
     * @method MLSearchContext#getQuery
     *
     * @return a structured query object
     */
    getQuery: function getQuery() {
      var query = qb.and();

      if ( _.keys(this.activeFacets).length ) {
        query = this.getFacetQuery();
      }

      if ( this.qtext ) {
        query = qb.and( query, qb.text( this.qtext ) );
      }

      if ( this.boostQueries.length ) {
        query = qb.boost(query, this.boostQueries);
      }

      if ( this.additionalQueries.length ) {
        query = qb.and(query, this.additionalQueries);
      }

      if ( this.options.includeProperties ) {
        query = qb.or(query, qb.properties(query));
      }

      query = qb.query(query);

      if ( this.options.sort ) {
        // TODO: this assumes that the sort operator is called "sort", but
        // that isn't necessarily true. Properly done, we'd get the options
        // from the server and find the operator that contains sort-order
        // elements
        query.query.queries.push( qb.operator('sort', this.options.sort) );
      }

      if ( this.options.snippet ) {
        // same problem as `sort`
        query.query.queries.push( qb.operator('results', this.options.snippet) );
      }

      return query;
    },

    /**
     * constructs a structured query from the current active facets
     * @method MLSearchContext#getFacetQuery
     *
     * @return a structured query object
     */
    getFacetQuery: function getFacetQuery() {
      var self = this,
          queries = [],
          query = {},
          constraintFn;

      _.forIn( self.activeFacets, function(facet, facetName) {
        if ( facet.values.length ) {
          constraintFn = function(values) {
            return qb.constraint( facet.type )( facetName, values );
          };

          if ( self.options.facetMode === 'or' ) {
            queries.push( constraintFn( facet.values ) );
          } else {
            queries = queries.concat( _.map(facet.values, constraintFn) );
          }
        }
      });

      if ( self.options.facetMode === 'or' ) {
        query = qb.or(query);
      } else {
        query = qb.and(queries);
      }

      return query;
    },

    /**
     * Construct a combined query from the current state
     * @method MLSearchContext#getCombinedQuery
     *
     * @return {Promise} - a promise resolved with the combined query
     */
    getCombinedQuery: function getCombinedQuery() {
      var d = $q.defer(),
          combined = { query: this.getQuery() };

      this.getStoredOptions(this.options.queryConfig).then(function(options) {
          combined.options = options;
          d.resolve(combined);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
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
      return active && _.contains(active.values, value);
    },

    /**
     * Add the facet/value/type combination to the activeFacets list
     * @method MLSearchContext#selectFacet
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @param {String} type - facet type
     * @return {MLSearchContext} `this`
     */
    selectFacet: function selectFacet(name, value, type) {
      if (/^"(.*)"$/.test(value)) {
        value = value.replace(/^"(.*)"$/, '$1');
      }
      var active = this.activeFacets[name];

      if ( active && !_.contains(active.values, value) ) {
        active.values.push(value);
      } else {
        this.activeFacets[name] = { type: type, values: [value] };
      }

      return this;
    },

    /**
     * Remove the facet/value combination from the activeFacets list
     * @method MLSearchContext#clearFacet
     *
     * @param {String} name - facet name
     * @param {String} value - facet value
     * @return {MLSearchContext} `this`
     */
    clearFacet: function clearFacet(name, value) {
      var active = this.activeFacets[name];

      active.values = _.filter( active.values, function(facetValue) {
        return facetValue !== value;
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
     * @return {MLSearchContext} `this`
     */
    toggleFacet: function toggleFacet(name, value) {
      var type;

      if ( this.isFacetActive(name, value) ) {
        this.clearFacet(name, value);
      } else {
        type = this.results.facets[name].type;
        this.selectFacet(name, value, type);
      }

      return this;
    },

    /**
     * Reset the activeFacets list
     * @method MLSearchContext#clearAllFacets
     *
     * @return {MLSearchContext} `this`
     */
    clearAllFacets: function clearAllFacets() {
      this.activeFacets = {};
      return this;
    },

    /**
     *
     * POST to /v1/values to return the next 5 facets. This function first
     * calls `mlRest.queryConfig` to get the current constraints. Once the
     * POST returns less than 5 facets, `facet.displayingAll` is set to true.
     *
     * @method * MLSearchContext#showMoreFacets
     *
     * @param {Object} facet - a facet object returned from {@link MLSearchContext#search}
     * @param {String} name - facet name
     * @param {String} [step] - the number of additional facet values to retrieve (defaults to `5`)
     *
     * @return {MLSearchContext} `this`
     */
    showMoreFacets: function showMoreFacets(facet, facetName, step) {
      var _this = this;
      step = step || 5;

      mlRest.queryConfig(this.getQueryOptions(), 'constraint').then(function(resp) {
        var options = resp.data.options.constraint;

        var myOption = options.filter(function (option) {
          return option.name === facetName;
        })[0];
        if (!myOption) {throw 'No constraint exists matching ' + facetName;}

        var searchOptions = _this.getQuery();
        searchOptions.options = {};
        searchOptions.options.constraint = _.cloneDeep(options);
        if (myOption.range && myOption.range['facet-option']) {
          myOption['values-option'] = myOption.range['facet-option'];
        }
        searchOptions.options.values = myOption;

        var searchConfig = { search: searchOptions };

        var start = facet.facetValues.length + 1;
        var limit = start + step;

        mlRest.values(facetName, {start: start, limit: limit}, searchConfig).then(function(resp) {
          var newFacets = resp.data['values-response']['distinct-value'];
          if (!newFacets || newFacets.length < (limit - start)) {
            facet.displayingAll = true;
          }

          _.each(newFacets, function(newFacetValue) {
            var newFacet = {};
            newFacet.name = newFacetValue._value;
            newFacet.value = newFacetValue._value;
            newFacet.count = newFacetValue.frequency;
            facet.facetValues.push(newFacet);
          });
        });
      });
      return this;
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
          facets = [],
          params = {};

      facets = this.getFacetParams();

      if ( facets.length ) {
        params[ this.options.params.facets ] = facets;
      }

      if ( page > 1 ) {
        params[ this.options.params.page ] = page;
      }

      if ( this.qtext ) {
        params[ this.options.params.qtext ] = this.qtext;
      }

      if ( this.options.sort ) {
        params[ this.options.params.sort ] = this.options.sort;
      }

      return params;
    },

    /**
     * Construct a URL query params object from the active facets
     * @method MLSearchContext#getFacetParams
     *
     * @return {Object} params - a URL query params object
     */
    getFacetParams: function getFacetParams() {
      var self = this,
          facetQuery = self.getFacetQuery(),
          queries = [],
          facets = [];

      queries = ( facetQuery['or-query'] || facetQuery['and-query'] ).queries;

      _.each(queries, function(query) {
        var constraint = query[ _.keys(query)[0] ],
            name = constraint['constraint-name'];

        _.each( constraint.value || constraint.uri, function(value) {
          // quote values with spaces
          if (/\s+/.test(value) && !/^"(.*)"$/.test(value)) {
            value = '"' + value + '"';
          }
          facets.push( name + self.options.params.separator + value );
        });
      });

      return facets;
    },

    /**
     * Update the current state based on the provided URL query params object
     * @method MLSearchContext#fromParams
     *
     * @param {Object} params - a URL query params object
     * @return a {Promise} resolved once the params have been applied
     */
    fromParams: function fromParams(params) {
      var self = this,
          d = $q.defer(),
          qtextP, facetsP, pageP, sortP;

      params = params || $location.search();
      qtextP = params[ this.options.params.qtext ] || null;
      pageP = params[ this.options.params.page ];
      sortP = params[ this.options.params.sort ];
      facetsP = params[ this.options.params.facets ];

      self.setText(qtextP);

      if ( pageP ) {
        pageP = parseInt(pageP) || 1;
        self.setPage( pageP );
      } else if ( this.options.params.page ) {
        self.setPage(1);
      }

      if (sortP) {
        self.setSort( decodeParam(sortP) );
      }

      self.clearAllFacets();

      if (facetsP) {
        if (self.results.facets) {
          self.fromFacetParam(facetsP);
          d.resolve();
        } else {
          self.getStoredOptions().then(function(options) {
            self.fromFacetParam(facetsP, options);
            d.resolve();
          });
        }
      } else {
        d.resolve();
      }

      return d.promise;
    },

    /**
     * Update the current active facets based on the provided URL query params object
     * @method MLSearchContext#fromFacetParam
     *
     * @param {Object} params - a URL query params object
     * @param {Object} storedOptions - a searchOptions object
     * @return a {Promise} resolved once the params have been applied
     */
    fromFacetParam: function fromFacetParam(param, storedOptions) {
      var self = this,
          values = _.map( asArray(param), decodeParam );

      _.each(values, function(value) {
        var tokens = value.split( self.options.params.separator ),
            facetName = tokens[0],
            facetValue = tokens[1],
            type = null;

        if ( storedOptions ) {
          type = getFacetConfig( storedOptions, facetName ).type;
        } else if ( self.results.facets ) {
          type = self.results.facets[facetName].type;
        } else {
          console.error('don\'t have facets or options for \'' + facetName +
                        '\', falling back to un-typed range queries');
        }

        self.selectFacet( facetName, facetValue, type );
      });
    },

    /**
     * Examines the current state, and determines if a new search is needed.
     *   (intended to be triggered on {$locationChangeSuccess})
     * @method MLSearchContext#locationChange
     *
     * @param {String} newUrl - the target URL of a location change
     * @param {String} oldUrl - the original URL of a location change
     * @param {Object} params - the search params of the target URL
     *
     * @return {Promise} a promise resolved after calling {@link MLSearchContext#fromParams} (if a new search is needed)
     */
    locationChange: function locationChange(newUrl, oldUrl) {
      var d = $q.defer(),
          samePage = pathsEqual(newUrl, oldUrl),
          sameQuery = _.isEqual( this.getParams(), $location.search() );

      if ( samePage && !sameQuery ) {
        this.fromParams().then(d.resolve);
      } else {
        d.reject();
      }

      return d.promise;
    },

    /************************************************************/
    /********** MLSearchContext data retrieval methods **********/
    /************************************************************/

    /**
     * Retrieves stored search options, caching the result in `this.storedOptions`
     * @method MLSearchContext#getStoredOptions
     *
     * @param {String} [name] - the name of the options to retrieve (defaults to `this.options.queryOptions`)
     * @return {Promise} a promise resolved with the stored options
     */
    getStoredOptions: function getStoredOptions(name) {
      var self = this,
          d = $q.defer();

      name = name || self.options.queryOptions;

      if ( self.storedOptions[name] ) {
        d.resolve( self.storedOptions[name] );
      } else {
        mlRest.queryConfig(name).then(function(response) {
            //TODO: transform?
            self.storedOptions[name] = response.data;
            d.resolve( self.storedOptions[name] );
          },
          function(reason) {
            d.reject(reason);
          });
      }

      return d.promise;
    },

    /**
     * Retrieves stored search options, caching the result in `this.storedOptions`
     * @method MLSearchContext#getAllStoredOptions
     *
     * @param {String[]} names - the names of the options to retrieve
     * @return {Promise} a promise resolved with `this.storedOptions`
     */
    getAllStoredOptions: function getAllStoredOptions(names) {
      var self = this,
          d = $q.defer(),
          result = {};

      // cache any options not already loaded
      $q.all( _.map(names, self.getStoredOptions) ).then(function() {
        // return only the names requested
        _.each(names, function(name) {
          result[name] = self.storedOptions[name];
        });
        d.resolve( result );
      });

      return d.promise;
    },

    /**
     * Gets search phrase suggestions based on the current state
     * @method MLSearchContext#suggest
     *
     * @param {String} qtext - the partial-phrase to match
     * @return {Promise} a promise resolved with search phrase suggestions
     */
    suggest: function suggest(qtext) {
      var d = $q.defer(),
          //TODO: figure out why getCombinedQuery errors
          combined = {
            search: { query: this.getQuery() }
          },
          params = {
            'partial-q': qtext,
            format: 'json',
            options: this.options.queryOptions
          };

      mlRest.suggest(params, combined).then(function(response) {
          d.resolve(response.data);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
    },

    /**
     * Runs a search based on the current state
     * @method MLSearchContext#search
     *
     * @return {Promise} a promise resolved with search results
     */
    search: function search() {
      var self = this,
          d = $q.defer();

      mlRest.search({
        options: self.options.queryOptions,
        structuredQuery: self.getQuery(),
        start: self.start,
        pageLength: self.options.pageLength,
        transform: self.searchTransform
      })
      .then(
        function(response) {
          self.results = response.data;
          self.transformMetadata();
          self.annotateActiveFacets();
          d.resolve(self.results);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
    },

    /**
     * Annotate the facets in the search results object with the selections from `this.activeFacets`
     * @method MLSearchContext#annotateActiveFacets
     *
     * @param {Object} [facets] - the search facets object to annotate; if `result` is falsy,
     * `this.annotateActiveFacets` is applied to `this.results.facets`
     */
    annotateActiveFacets: function annotateActiveFacets(facets) {
      var self = this;

      facets = facets || self.results.facets;

      _.forIn( facets, function(facet, name) {
        var selected = self.activeFacets[name];

        if ( selected ) {
          _.chain(facet.facetValues)
            .filter(function(value) {
              return _.contains( selected.values, value.name );
            })
            .each(function(value) {
              facet.selected = value.selected = true;
            });
        }
      });
    },

    /**
     * Transform each search result's metadata object from an array of objects to an object
     * @method MLSearchContext#transformMetadata
     *
     * @param {Object} [result] - the search result to transform; if `result` is falsy,
     * `this.transformMetadata` is applied to each result in `this.results.results`
     */
    transformMetadata: function transformMetadata(result) {
      var self = this,
          metadata;

      result = result || this.results.results;

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
      return this.getQuery();
    },

    /**
     * @method MLSearchContext#serializeStructuredQuery
     * @deprecated
     *
     * @see MLSearchContext#getParams
     */
    serializeStructuredQuery: function serializeStructuredQuery() {
      return this.getParams();
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

  // this function get's called in a tight loop, so loading the options async won't work
  // (could end up requesting the options over and over ...)
  function getFacetConfig(storedOptions, name) {
    var constraint = _.where( storedOptions.options.constraint, { name: name } )[0];

    constraint.type = constraint.collection ? 'collection' :
                      constraint.custom ? 'custom' :
                      constraint.range.type;

    return constraint;
  }

  //TODO: move to util module
  function asArray() {
    var args;

    if ( arguments.length === 0 ) {
      args = [];
    } else if ( arguments.length === 1) {
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

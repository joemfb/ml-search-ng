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

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
   *
   * @param {Object} $q - angular promise service
   * @param {Object} $location - angular location service
   * @param {MLRest} MLRest - low-level ML REST API wrapper (from {@link https://github.com/joemfb/ml-common-ng})
   * @param {MLQueryBuilder} MLQueryBuilder - structured query builder (from {@link https://github.com/joemfb/ml-common-ng})
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
     * @param {Object[]} namespace - objects with `uri` and `prefix` properties
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
     * @param {Object} boost query
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
     * @param {Number} search - the desired search results page
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
        query = qb.or(queries);
      } else {
        query = qb.and(queries);
      }

      return query;
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
      var d = $q.defer(),
        combined = {
          search: { query: this.getQuery() }
        };

      if ( !includeOptions ) {
        d.resolve(combined);
        return d.promise;
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
      return !!active && _.contains(active.values, value);
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
     * Removes the facet/value combination from the activeFacets list
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
      var config;

      if ( this.isFacetActive(name, value) ) {
        this.clearFacet(name, value);
      } else {
        config = this.getFacetConfig(name);
        this.selectFacet(name, value, config.type);
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
          limit = start + step - 1,
          self = this;

      return this.getStoredOptions()
      .then(function(storedOptions) {
        var constraint = storedOptions && storedOptions.options && storedOptions.options.constraint && _.where(asArray(storedOptions.options.constraint), { name: facetName })[0];

        if ( !constraint ) {
          return $q.reject(new Error('No constraint exists matching ' + facetName));
        }

        var newOptions = { constraint: constraint, values: _.cloneDeep(constraint) };
        newOptions.values['values-option'] = constraint.range && constraint.range['facet-option'];

        return self.getValues(facetName, { start: start, limit: limit }, newOptions);
      })
      .then(function(resp) {
        var newFacets = resp && resp.data && resp.data['values-response'] && resp.data['values-response']['distinct-value'];
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
          facets = this.getFacetParams(),
          params = {},
          prefix = this.getParamsPrefix();

      if ( facets.length && this.options.params.facets !== null ) {
        params[ prefix + this.options.params.facets ] = facets;
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
     * Gets the current search related URL params (excluding any params not controlled by {@link MLSearchContext})
     * @method MLSearchContext#getCurrentParams
     *
     * @param {Object} [params] - URL params (defaults to `$location.search()`)
     * @return {Object} search-related URL params
     */
    getCurrentParams: function getCurrentParams(params) {
      params = _.pick(
        params || $location.search(),
        this.getParamsKeys()
      );

      if ( params.f ) {
        params.f = asArray(params.f);
      }

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
          d = $q.defer(),
          paramsConf = this.options.params;

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

      this.fromParam( paramsConf.facets, params,
        function(val) {
          self.clearAllFacets();

          // ensure that facet type information is available
          if ( self.results.facets ) {
            self.fromFacetParam(val);
            d.resolve();
          } else {
            self.getStoredOptions().then(function(options) {
              self.fromFacetParam(val, options);
              d.resolve();
            });
          }
        },
        function() {
          self.clearAllFacets();
          d.resolve();
        }
      );

      return d.promise;
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

      callback.call( this, value );
    },

    /**
     * Updates the current active facets based on the provided facet URL query params
     * @method MLSearchContext#fromFacetParam
     * @private
     *
     * @param {Array|String} param - facet URL query params
     * @param {Object} [storedOptions] - a searchOptions object
     */
    fromFacetParam: function fromFacetParam(param, storedOptions) {
      var self = this,
          values = _.map( asArray(param), decodeParam );

      _.each(values, function(value) {
        var tokens = value.split( self.options.params.separator ),
            facetName = tokens[0],
            facetValue = tokens[1],
            facetInfo = self.getFacetConfig( facetName, storedOptions ) || {};

        if ( !facetInfo.type ) {
          console.error('don\'t have facets or options for \'' + facetName +
                        '\', falling back to un-typed range queries');
        }

        self.selectFacet( facetName, facetValue, facetInfo.type );
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
      var d = $q.defer();

      params = this.getCurrentParams( params );

      // still on the search page, but there's a new query
      var shouldUpdate = pathsEqual(newUrl, oldUrl) &&
                         !_.isEqual( this.getParams(), params );

      if ( shouldUpdate ) {
        return this.fromParams(params);
      }

      d.reject();
      return d.promise;
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
      var self = this,
          d = $q.defer();

      name = name || self.getQueryOptions();

      if ( self.storedOptions[name] ) {
        d.resolve( self.storedOptions[name] );
        return d.promise;
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
     * @return {Promise} a promise resolved with search phrase suggestions
     */
    suggest: function suggest(qtext) {
      var params = {
        'partial-q': qtext,
        format: 'json',
        options: this.getQueryOptions()
      };

      return this.getCombinedQuery(false)
      .then(function(combined) {
        return mlRest.suggest(params, combined);
      })
      .then(function(response) {
        return response.data;
      });
    },

    /**
     * Retrieves values or tuples from 1-or-more lexicons
     * @method MLSearchContext#values
     *
     * @param {String} name - the name of a `values` or search `constraint` definition
     * @param {Object} [params] - URL params
     * @param {Object} [options] - search options, used in a combined query
     * @return {Promise} a promise resolved with values
     */
    values: function values(name, params, options) {
      var self = this;
      
      // TODO: what other conditions
      // [GJo] This looks a bit peculiar. If you have start and limit in params, but no options, then they get lost?
      if ( !options && params && params.options) {
        options = params;
        params = null;
      }

      var value = options && options.options && options.options.values && _.where(asArray(options.options.values), { 'name': name })[0];

      if ( value ) {
        return self.getValues(name, params, options);
      }

      return self.getStoredOptions()
      .then(function(storedOptions) {
        var constraint, newOptions;

        value = storedOptions && storedOptions.options && storedOptions.options.values && _.where(asArray(storedOptions.options.values), { name: name })[0];
        
        if ( !value ) {
          constraint = storedOptions && storedOptions.options && storedOptions.options.constraint && _.where(asArray(storedOptions.options.constraint), { name: name })[0];
          
          if ( !constraint ) {
            return $q.reject(new Error('No values or constraint exists matching ' + name));
          }
          
          newOptions = { constraint: constraint, values: _.cloneDeep(constraint) };
          newOptions.values['values-option'] = newOptions.values.range['facet-option'];
        } else {
          newOptions = {};
          _.extend(newOptions, options);
          newOptions.values = value;
        }

        return self.getValues(name, params, newOptions);
      });
    },
    
    /**
     * Retrieves values or tuples from 1-or-more lexicons
     * @method MLSearchContext#getValues
     *
     * @param {String} name - the name of a `value-option` definition
     * @param {Object} [params] - URL params
     * @param {Object} [options] - search options, used in a combined query
     * @return {Promise} a promise resolved with values
     */
    getValues: function getValues(name, params, options) {
      var self = this;
      
      params = params || {};
      params.start = params.start !== undefined ? params.start : 1;
      params.limit = params.limit !== undefined ? params.limit : 20;

      if ( !options ) {
        params.options = self.getQueryOptions();
      }

      return self.getCombinedQuery(false)
      .then(function(combined) {
        combined.search.options = options;
        return mlRest.values(name, params, combined);
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
        query = this.getQuery(),
        combined = null,
        includeOptionsParam = true,
        params = {
          start: this.start,
          pageLength: this.options.pageLength,
          transform: this.searchTransform
        };

      if ( adhoc ) {
        combined = {};

        if ( adhoc.search ) {
          includeOptionsParam = false;
          combined.search = adhoc.search;
        } else {
          combined = { search: {} };

          if ( adhoc.options ) {
            includeOptionsParam = false;
            combined.search.options = adhoc.options;
            combined.search.query = query.query;
          } else if ( adhoc.query ) {
            combined.search.query = adhoc.query;
          } else {
            combined.search.options = adhoc;
            combined.search.query = query.query;
          }
        }
      } else {
        params.structuredQuery = query;
      }

      if ( includeOptionsParam ) {
        params.options = this.getQueryOptions();
      }

      return mlRest.search(params, combined)
      .then(function(response) {
        var results = response.data;

        // the results of adhoc queries aren't preserved
        if ( combined ) {
          self.transformMetadata(results);
          self.annotateActiveFacets(results);
          if (self.options.includeAggregates) {
            self.getAggregates(results);
          }
          return results;
        }

        self.results = results;
        self.transformMetadata();
        self.annotateActiveFacets();
        if (self.options.includeAggregates) {
          self.getAggregates();
        }
        return self.results;
      });
    },

    /**
     * Annotates facets (from a search response object) with the selections from `this.activeFacets`
     * @method MLSearchContext#annotateActiveFacets
     *
     * @param {Object} [facets] - the search facets object (defaults to `this.results.facets`)
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
            })
            .value(); // thwart lazy evaluation
        }
      });
    },

    /**
     * Gets aggregates for facets (from a search response object) based on facet type
     * @method MLSearchContext#getAggregates
     *
     * @param {Object} [facets] - the search facets object (defaults to `this.results.facets`)
     */
    getAggregates: function getAggregates(facets) {
      var self = this;

      facets = facets || self.results.facets;
      
      return self.getStoredOptions()
      .then(function(storedOptions) {
        var promisses = [];
  
        _.forIn( facets, function(facet, facetName) {
          var facetType = facet.type,
              constraint = storedOptions && storedOptions.options && storedOptions.options.constraint && _.where(asArray(storedOptions.options.constraint), { name: facetName })[0];

          if ( !constraint ) {
            return $q.reject(new Error('No constraint exists matching ' + facetName));
          }

          var newOptions = { constraint: constraint, values: _.cloneDeep(constraint) };
          newOptions.values['values-option'] = constraint.range && constraint.range['facet-option'];

          // these work for all index types
          newOptions.values.aggregate = [
            { apply: 'count' },
            { apply: 'min' },
            { apply: 'max' }
          ];

          var numberTypes = ['xs:int', 'xs:unsignedInt', 'xs:long', 'xs:unsignedLong', 'xs:float', 'xs:double', 'xs:decimal'];
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

          promisses.push(
            self.getValues(facetName, { start: 1, limit: 0 }, newOptions)
            .then(function(resp) {
              var aggregates = resp.data && resp.data['values-response'] && resp.data['values-response']['aggregate-result'];
              _.each( aggregates, function(aggregate) {
                facet[aggregate.name] = aggregate._value;
              });
            })
          );
        });
        
        return $q.all(promisses);
      });
    },

    /**
     * Transforms the metadata array in each search response result object to an object, key'd by `metadata-type`
     * @method MLSearchContext#transformMetadata
     *
     * @param {Object} [result] - the search results object (defaults to `this.results.results`)
     */
    transformMetadata: function transformMetadata(result) {
      var self = this,
          metadata;

      result = result || this.results.results || {};

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

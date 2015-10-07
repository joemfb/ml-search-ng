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

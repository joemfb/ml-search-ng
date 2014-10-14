angular.module('ml.search', ['ml.common']);

(function () {
  'use strict';

  angular.module('ml.search')
    .factory('MLSearchFactory', MLSearchFactory);

  MLSearchFactory.$inject = ['$q', 'MLRest'];

  function MLSearchFactory($q, mlRest) {
    var cache = {};

    function newContext(name, options) {
      var context;

      if (_.isObject(name) && !options) {
        options = name;
        name = null;
      }

      //TDOO: get named if exists?
      context = new MLSearchContext($q, mlRest, options);

      if (name) {
        cache[name] = context;
      }

      return context;
    }

    function getNamedContext(name) {
      return cache[name];
    }

    return {
      newContext: newContext,
      getNamedContext: getNamedContext
    };
  }

  angular.extend(MLSearchContext.prototype, {
    defaults: {
      //TODO: rename?
      queryOptions: 'all',
      pageLength: 10,
      snippet: 'compact',
      //TODO: rename
      multiFacetUnion: false,
      params: {
        separator: ':',
        qtext: 'q',
        facets: 'f',
        sort: 's',
        page: 'p'
        //TODO: options?
      }
    }
  });

  function MLSearchContext($q, mlRest, options) {
    var service = {},
        results = {},
        facetSelections = {},
        boostQueries = [],
        qtext = null,
        sort = null,
        start = 1;

    options = _.merge(_.cloneDeep(this.defaults), options);

    service = {
      search: search,

      getResults: getResults,
      getText: getText,
      setText: setText,
      getPage: getPage,
      setPage: setPage,
      getPageLength: getPageLength,
      setPageLength: setPageLength,
      getSort: getSort,
      setSort: setSort,
      clearSort: clearSort,
      getSnippet: getSnippet,
      setSnippet: setSnippet,
      clearSnippet: clearSnippet,
      getQueryOptions: getQueryOptions,

      toggleFacet: toggleFacet,
      selectFacet: selectFacet,
      clearFacet: clearFacet,
      clearAllFacets: clearAllFacets,

      getQuery: getQuery,
      parseStructuredQuery: parseStructuredQuery,

      getParams: getParams,
      getParamsConfig: getParamsConfig,
      fromParams: fromParams,

      //DEPRECATED: todo: remove
      getStructuredQuery: getQuery,
      serializeStructuredQuery: getParams
    };

    function getResults() {
      return results;
    }

    function getText() {
      return qtext;
    }

    function setText(text) {
      if (text !== '') {
        qtext = text;
      } else {
        qtext = null;
      }
      /*jshint validthis:true */
      return this;
    }

    function getPage() {
      var page = Math.floor(start / options.pageLength) + 1;
      return page;
    }

    function setPage(page) {
      start = 1 + (page - 1) * options.pageLength;
      return this;
    }

    function getPageLength() {
      return options.pageLength;
    }

    function setPageLength(pageLength) {
      options.pageLength = pageLength;
      return this;
    }

    function getSort() {
      return sort;
    }

    function setSort(sortField) {
      sort = sortField;
      return this;
    }

    function clearSort() {
      sort = null;
      return this;
    }

    function getSnippet() {
      return options.snippet;
    }

    function setSnippet(snippet) {
      options.snippet = snippet;
      return this;
    }

    function clearSnippet() {
      options.snippet = 'compact';
      return this;
    }

    function getQueryOptions() {
      return options.queryOptions;
    }

    function selectFacet(name, value, type) {
      if ( facetSelections[name] && !_.contains(facetSelections[name].values, value) ) {
        facetSelections[name].values.push(value);
      } else {
        facetSelections[name] = {
          type: type,
          values: [value]
        };
      }
      /*jshint validthis:true */
      return this;
    }

    function clearFacet(name, value) {
      facetSelections[name].values = _.filter( facetSelections[name].values, function(facetValue) {
        return facetValue !== value;
      });
      /*jshint validthis:true */
      return this;
    }

    function clearAllFacets() {
      facetSelections = {};
      //TODO: check
      _.forIn( results.facets, function(facet, name) {
        if ( facet.selected ) {
          _.chain(facet.facetValues)
            .where({ selected: true })
            .each(function(value) {
              facet.selected = value.selected = false;
            });
        }
      });

      return this;
    }

    //private function for toggling the state of a facet selection
    function toggleFacetProperties(facet, value) {
      var selected = false;

      if ( facet ) {
        _.chain(facet.facetValues)
          .where({ name: value })
          .each(function(facetValue) {
            selected = facetValue.selected = !facetValue.selected;
          });

        facet.selected = _.where( facet.facetValues, { selected: true } ).length > 0;
      }

      return selected;
    }

    function toggleFacet(name, value) {
      var facet = results.facets[name];

      if ( toggleFacetProperties(facet, value) ) {
        selectFacet(name, value, facet.type);
      } else {
        clearFacet(name, value);
      }
      /*jshint validthis:true */
      return this;
    }

    function parseSelectedFacets(facets) {
      _.forIn( facets, function(facet, name) {
        var selected = facetSelections[name];

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
    }

    // private function for transforming result metadata from an array of objects to an object
    function transformMetadata(result) {
      var metadata = result.metadata;
      result.metadata = {};

      _.each(metadata, function(obj) {
        var key = _.without(_.keys(obj), 'metadata-type')[0],
            type = obj[ 'metadata-type' ],
            value = obj[ key ];

        if (!_.contains(result.metadata, key)) {
          result.metadata[ key ] = { 'metadata-type': type, values: [] };
        }

        result.metadata[ key ].values.push(value);
      });
    }

    function search() {
      var d = $q.defer();

      mlRest.search({
        options: options.queryOptions,
        structuredQuery: getQuery(),
        start: start,
        pageLength: options.pageLength
      })
      .then(
        function(response) {
          results = response.data;
          _.each(results.results, transformMetadata);
          parseSelectedFacets(results.facets);
          d.resolve(results);
        },
        function(reason) {
          d.reject(reason);
        });

      return d.promise;
    }

    function buildConstraintQuery(queries, values, constraintFn) {
      if ( options.multiFacetUnion ) {
        _.each( values, function(value) {
          queries.push( constraintFn( [value] ) );
        });
      } else {
        queries.push( constraintFn( values ) );
      }
      return queries;
    }

    function builderFactory(facetName, facetValues, queries) {
      var constraint = {},
          constraintFn;

      return function(type, valueName) {
        var name = type + '-constraint-query';

        constraint[ name ] = { 'constraint-name': facetName };
        valueName = valueName || 'value';

        constraintFn = function(values) {
          constraint[ name ][ valueName ] = values;
          return constraint;
        };

        return buildConstraintQuery(queries, facetValues, constraintFn);
      };
    }

    function buildFacetQuery() {
      var queries = [];

      _.forIn( facetSelections, function(facet, facetName) {
        if ( facet.values.length > 0 ) {

          var builder = builderFactory(facetName, facet.values, queries);

          if (facet.type === 'collection') {
            builder('collection', 'uri');
          }
          else if ( facet.type === 'custom' || _.contains(options.customConstraintNames, name) ) {
            builder('custom');
          } else  {
            builder('range');
          }

        }
      });

      return queries;
    }

    function buildStructuredQuery(queries) {
      var structured = {};

      if (boostQueries.length > 0) {
        structured = {
          query: {
            'queries': [{
              'boost-query': {
                'matching-query': {
                  'and-query': {
                    'queries': queries
                  }
                },
                'boosting-query': {
                  'and-query': {
                    'queries': boostQueries
                  }
                }
              }
            }]
          }
        };
      } else {
        structured = {
          query: {
            'queries': [{
              'and-query': {
                'queries': queries
              }
            }]
          }
        };
      }

      if (options.includeProperties) {
        structured = {
          query: {
            'queries': [{
              'or-query': {
                'queries': [
                  structured,
                  { 'properties-query': structured }
                ]
              }
            }]
          }
        };
      }

      return structured;
    }

    function getQuery() {
      var queries = buildFacetQuery(),
          structured = {};

      if (qtext !== null) {
        queries.push({
          'qtext': qtext
        });
      }

      structured = buildStructuredQuery(queries);

      if (sort) {
        // TODO: this assumes that the sort operator is called "sort", but
        // that isn't necessarily true. Properly done, we'd get the options
        // from the server and find the operator that contains sort-order
        // elements
        structured.query.queries.push({
          'operator-state': {
            'operator-name': 'sort',
            'state-name': sort
          }
        });
      }

      if (options.snippet) {
        structured.query.queries.push({
          'operator-state': {
            'operator-name': 'results',
            'state-name': options.snippet
          }
        });
      }

      return structured;
    }

    //TODO: remove. likely obsolete
    function setFacetFromQuery(query) {
      var constraintQuery, values, type;

      if ( query['collection-constraint-query'] ) {
        constraintQuery = query['collection-constraint-query'];
        type = 'collection';
      } else if ( query['custom-constraint-query'] ) {
        constraintQuery = query['custom-constraint-query'];
        type = 'custom';
      } else {
        constraintQuery = query['range-constraint-query'];
        //TODO: get type from facet object (requires search:response to be saved in searchContext)
      }

      if ( constraintQuery ) {
        values = constraintQuery.value || constraintQuery.uri;
        if ( !_.isArray(values) ) {
          values = [values];
        }

        _.each( values, function(value) {
          selectFacet( constraintQuery['constraint-name'], value, type );
        });
      }
    }

    //TODO: remove. likely obsolete
    function parseStructuredQuery( q ) {
      //TODO: other query types (not-query, and-not-query, etc.)
      q = q['and-query'] || q['or-query'] || q;

      if ( q.queries ) {
        _.each( q.queries, function( q ) {
          parseStructuredQuery( q );
        });
      } else {
        setFacetFromQuery( q );
      }
    }

    function getParamsConfig() {
      return options.params;
    }

    //TODO: setParamsConfig?

    function getFacetParams() {
      var queries = buildFacetQuery(),
          facets = [];

      _.each(queries, function(query) {
        var constraint = query[ _.keys(query)[0] ],
            name = constraint['constraint-name'];

        _.each( constraint.value || constraint.uri, function(value) {
          if (/\s+/.test(value)) {
            value = '"' + value + '"';
          }
          facets.push( name + options.params.separator + value );
        });
      });

      return facets;
    }

    function getParams() {
      var facets = getFacetParams(),
          page = getPage(),
          params = {};

      if (facets.length) {
        params[ options.params.facets ] = facets;
      }

      if (page > 1) {
        params[ options.params.page ] = page;
      }

      if (qtext) {
        params[ options.params.qtext ] = qtext;
      }

      if (sort) {
        params[ options.params.sort ] = sort;
      }

      return params;
    }

    function decodeParam(value) {
      return decodeURIComponent(value.replace(/\+/g, '%20'));
    }

    function fromFacetParam(param) {
      if (!_.isArray(param)) {
        param = [param];
      }
      _.chain(param)
        .map(decodeParam)
        .each(function(value) {
          var tokens = value.split(options.params.separator);
          selectFacet(tokens[0], tokens[1]);
        });
    }

    function fromParams(params) {
      _.forIn(params, function(param, name) {
        switch(name) {
          case options.params.qtext:
            setText( decodeParam(param) );
            break;
          case options.params.page:
            setPage( parseInt(decodeParam(param)) );
            break;
          case options.params.sort:
            setSort( decodeParam(param) );
            break;
          case options.params.facets:
            fromFacetParam(param);
            break;
          default:
            console.error('unknown param: ' + name);
        }
      });
    }

    return service;

  }

})();

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

  function MLSearchContext($q, mlRest, options) {
    var defaults = {
          //TODO: rename?
          queryOptions: 'all',
          pageLength: 10,
          snippet: 'compact',
          //TODO: rename
          multiFacetUnion: false
        },
        service = {},
        response = {},
        facetSelections = {},
        boostQueries = [],
        qtext = null,
        sort = null,
        start = 1;

    options = angular.extend(defaults, options);

  //MLSearchContext.prototype

    service = {
      search: search,

      getResponse: getResponse,
      getText: getText,
      setText: setText,
      getPage: getPage,
      setPage: setPage,
      setPageLength: setPageLength,
      setSort: setSort,
      clearSort: clearSort,
      setSnippet: setSnippet,
      clearSnippet: clearSnippet,
      getQueryOptions: getQueryOptions,

      toggleFacet: toggleFacet,
      selectFacet: selectFacet,
      clearFacet: clearFacet,
      clearAllFacets: clearAllFacets,

      getStructuredQuery: getStructuredQuery,
      serializeStructuredQuery: serializeStructuredQuery,
      parseStructuredQuery: parseStructuredQuery
    };

    function getResponse() {
      return response;
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

    //TODO: ??
    function getPage() {
      return null;
    }

    function setPage(page) {
      start = 1 + (page - 1) * options.pageLength;
      return this;
    }

    function setPageLength(pageLength) {
      options.pageLength = pageLength;
      return this;
    }

    function setSort(sortField) {
      sort = sortField;
      return this;
    }

    function clearSort() {
      sort = null;
      return this;
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
      _.forIn( response.facets, function(facet, name) {
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
      var facet = response.facets[name];

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
        structuredQuery: getStructuredQuery(),
        start: start,
        pageLength: options.pageLength
      })
      .then(
        function(data) {
          _.each(data.results, transformMetadata);
          parseSelectedFacets(data.facets);
          response = data;
          d.resolve(data);
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

    function getStructuredQuery() {
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

    function serializeFacetQuery() {
      var queries = buildFacetQuery(),
          facets = [];

      _.each(queries, function(query) {
        var constraint = query[ _.keys(query)[0] ];

        _.each( constraint.value || constraint.uri, function(value) {
          if (/\s+/.test(value)) {
            value = '"' + value + '"';
          }
          facets.push( constraint['constraint-name'] + ':' + value );
        });
      });

      return facets.join(' ');
    }

    function serializeStructuredQuery() {
      var facets = serializeFacetQuery(),
          response = {};

      //TODO: property query, boosting, snippet/other operators, anything else?

      if ( facets ) {
        response.facets = facets;
      }

      if ( qtext ) {
        response.q = qtext;
      }

      if ( sort ) {
        response.sort = sort;
      }

      return response;
    }

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

    return service;

  }

})();

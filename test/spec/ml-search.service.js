/* global describe, beforeEach, module, it, expect, inject, afterEach, jasmine */

describe('MLSearchContext', function () {
  'use strict';

  var factory, $httpBackend, $q, $location, $rootScope;

  //fixtures
  beforeEach(module('search-results.json'));
  beforeEach(module('search-results-paginated.json'));
  beforeEach(module('search-results-with-facets.json'));
  beforeEach(module('options-with-grammer.json'));
  beforeEach(module('options-constraint.json'));
  beforeEach(module('options-constraint-color.json'));

  beforeEach(module('ml.search'));

  beforeEach(inject(function ($injector) {
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');
    $location = $injector.get('$location');
    $rootScope = $injector.get('$rootScope');

    factory = $injector.get('MLSearchFactory');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
  });

  describe('#getters-setters', function () {

    it('has a query builder', function() {
      var mlSearch = factory.newContext();
      expect(mlSearch.qb).not.toBeNull();
    });

    it('gets active facets', function() {
      var mlSearch = factory.newContext(),
          actual;

      mlSearch.selectFacet('name', 'value');
      actual = mlSearch.getActiveFacets();

      expect(actual.name).toBeDefined();
      expect(actual.name.values.length).toEqual(1);
      expect(actual.name.values[0].value).toEqual('value');
      expect(actual.name.values[0].negated).toEqual(false);

      mlSearch.selectFacet('name', 'value2', undefined, true);
      actual = mlSearch.getActiveFacets();

      expect(actual.name).toBeDefined();
      expect(actual.name.values.length).toEqual(2);
      expect(actual.name.values[0].value).toEqual('value');
      expect(actual.name.values[1].value).toEqual('value2');
      expect(actual.name.values[0].negated).toEqual(false);
      expect(actual.name.values[1].negated).toEqual(true);

    });

    it('gets namespace prefix', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespacePrefix('http://example.com')).toEqual('ex');
    });

    it('gets namespace uri', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([
        { prefix: 'ex', uri: 'http://example.com' },
        { prefix: 'ot', uri: 'http://other.org' }
      ]);

      expect(mlSearch.getNamespaceUri('ex')).toEqual('http://example.com');
    });

    it('gets namespaces', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespaces().length).toEqual(1);
      expect(mlSearch.getNamespaces()[0].prefix).toEqual('ex');
      expect(mlSearch.getNamespaces()[0].uri).toEqual('http://example.com');
    });

    it('adds namespace', function() {
      var mlSearch = factory.newContext();
      mlSearch.addNamespace({ prefix: 'ex', uri: 'http://example.com' });

      expect(mlSearch.getNamespaces().length).toEqual(1);
      expect(mlSearch.getNamespaces()[0].prefix).toEqual('ex');
      expect(mlSearch.getNamespaces()[0].uri).toEqual('http://example.com');


      mlSearch.addNamespace({ prefix: 'ie', uri: 'http://example.com/ie' });

      expect(mlSearch.getNamespaces().length).toEqual(2);
      expect(mlSearch.getNamespaces()[1].prefix).toEqual('ie');
      expect(mlSearch.getNamespaces()[1].uri).toEqual('http://example.com/ie');
    });

    it('clears namespaces', function() {
      var mlSearch = factory.newContext();
      mlSearch.setNamespaces([{ prefix: 'ex', uri: 'http://example.com' }]);

      expect(mlSearch.getNamespaces().length).toEqual(1);
      expect(mlSearch.getNamespaces()[0].prefix).toEqual('ex');
      expect(mlSearch.getNamespaces()[0].uri).toEqual('http://example.com');

      mlSearch.clearNamespaces();
      expect(mlSearch.getNamespaces().length).toEqual(0);
    });

    it('gets and sets boostQueries', function() {
      var mlSearch = factory.newContext(),
          qb = mlSearch.qb,
          boost = qb.and();

      mlSearch.addBoostQuery(boost);

      expect(mlSearch.getBoostQueries().length).toEqual(1);
      expect(mlSearch.getBoostQueries()[0]).toEqual(boost);

      expect( mlSearch.getQuery().query.queries[0]['boost-query']['boosting-query'][0] )
        .toEqual(boost);

      mlSearch.clearBoostQueries();

      expect(mlSearch.getBoostQueries().length).toEqual(0);
    });

    it('gets and sets additionalQueries', function() {
      var mlSearch = factory.newContext(),
          qb = mlSearch.qb,
          additional = qb.and();

      mlSearch.addAdditionalQuery(additional);

      expect(mlSearch.getAdditionalQueries().length).toEqual(1);
      expect(mlSearch.getAdditionalQueries()[0]).toEqual(additional);

      expect( mlSearch.getQuery().query.queries[0]['and-query'].queries[1][0] )
        .toEqual(additional);

      mlSearch.clearAdditionalQueries();

      expect(mlSearch.getAdditionalQueries().length).toEqual(0);
    });

    it('gets and sets search transform', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getTransform()).toBeNull();
      expect(mlSearch.setTransform('test')).toBe(mlSearch);
      expect(mlSearch.getTransform()).toEqual('test');
    });

    it('sets the query text', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getText()).toBeNull();
      expect(mlSearch.setText('test').getText()).toEqual('test');
      expect(mlSearch.setText('').getText()).toBeNull();

      expect(mlSearch.getQuery().query.queries[0]['and-query'].queries.length).toEqual(0);
      expect(mlSearch.setText('test')).toBe(mlSearch);
      expect(mlSearch.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);
      expect(mlSearch.getQuery().query.queries[0]['and-query'].queries[1].qtext).toEqual('test');
    });

    it('gets the query text', function() {
      var mlSearch = factory.newContext();
      expect(mlSearch.getText()).toBe(null);
      expect(mlSearch.setText('test')).toBe(mlSearch);
      expect(mlSearch.getText()).toEqual('test');
    });

    it('sets and gets page number and page length', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getPageLength()).toEqual(10);
      expect(mlSearch.setPage(4)).toBe(mlSearch);
      expect(mlSearch.getPage()).toEqual(4);

      expect(mlSearch.setPageLength(20)).toBe(mlSearch);
      expect(mlSearch.getPageLength()).toEqual(20);
      expect(mlSearch.setPage(9).getPage()).toEqual(9);

      expect(mlSearch.setPageLength(18).getPageLength()).toEqual(18);
      expect(mlSearch.setPage(7).getPage()).toEqual(7);
      expect(mlSearch.setPage(1).getPage()).toEqual(1);
    });

    it('initializes and gets queryOptions', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getQueryOptions()).toBe('all');

      mlSearch = factory.newContext({ queryOptions: 'some' });
      expect(mlSearch.getQueryOptions()).toBe('some');

      mlSearch = factory.newContext({ queryOptions: null });
      expect(mlSearch.getQueryOptions()).toBeNull();
    });

    it('gets, sets, and clears snippet', function() {
      // this test assumes that the results transform operator is called "results"; the service code
      // makes this assumption as well.

      var mlSearch = factory.newContext();

      expect(mlSearch.getSnippet()).toBe('compact');

      expect( JSON.stringify(mlSearch.getQuery()).match(/operator-state/) ).not.toBeNull();

      mlSearch = factory.newContext({ snippet: 'full' });

      expect(mlSearch.getSnippet()).toBe('full');
      expect(mlSearch.setSnippet('partial')).toBe(mlSearch);
      expect(mlSearch.getSnippet()).toBe('partial');

      expect(mlSearch.clearSnippet()).toBe(mlSearch);
      expect(mlSearch.getSnippet()).toBe('compact');

      expect(mlSearch.setSnippet(null)).toBe(mlSearch);
      expect( JSON.stringify(mlSearch.getQuery()).match(/operator-state/) ).toBeNull();

      //TODO: getQuery()
    });

    it('gets, sets, and clears sort', function() {
      // this test assumes that the sort operator is called "sort"; the service code
      // makes this assumption as well.

      var mlSearch = factory.newContext();

      expect(mlSearch.getSort()).toBe(null);
      expect(mlSearch.setSort('date')).toBe(mlSearch);
      expect(mlSearch.getSort()).toEqual('date');

      var operator = _.chain(mlSearch.getQuery().query.queries)
        .filter(function(obj) {
          return !!obj['operator-state'];
        }).filter(function(obj) {
          return obj['operator-state']['operator-name'] === 'sort';
        })
        .valueOf();

      expect(operator.length).toEqual(1);
      expect(operator[0]['operator-state']['state-name']).not.toBeUndefined();
      expect(operator[0]['operator-state']['state-name']).toEqual('date');
      expect(mlSearch.clearSort()).toBe(mlSearch);
      expect(mlSearch.getSort()).toBe(null);
    });

    it('should include properties query', function() {
      var mlSearch = factory.newContext();
      expect( JSON.stringify(mlSearch.getQuery()).match(/properties-query/) ).toBeNull();

      mlSearch = factory.newContext({ includeProperties: true });
      expect( JSON.stringify(mlSearch.getQuery()).match(/properties-query/) ).not.toBeNull();
    });

    it('gets URL params config', function() {
      var mlSearch = factory.newContext();

      expect(mlSearch.getParamsConfig()).not.toBeNull();
      expect(mlSearch.getParamsConfig().separator).toEqual(':');
      expect(mlSearch.getParamsConfig().qtext).toEqual('q');
      expect(mlSearch.getParamsConfig().facets).toEqual('f');
      expect(mlSearch.getParamsConfig().negatedFacets).toEqual('n');
      expect(mlSearch.getParamsConfig().sort).toEqual('s');
      expect(mlSearch.getParamsConfig().page).toEqual('p');

      // TODO: test with options
    });

    it('gets URL params keys', function() {
      var mlSearch = factory.newContext();
      var keys = ['q', 'f', 'n', 's', 'p'];

      // using _.difference since param order is non-determinant
      expect( _.difference( mlSearch.getParamsKeys(), keys ).length ).toEqual(0);
    });

    it('should support deprecated functions', function() {
      var mlSearch = factory.newContext();
      expect( mlSearch.getStructuredQuery() ).toEqual( mlSearch.getQuery() );
      expect( mlSearch.serializeStructuredQuery() ).toEqual( mlSearch.getParams() );
    });
  });

  describe('#transforms-response', function () {

    var mockResults, mockPaginatedResults, mockResultsFacets;

    beforeEach(inject(function($injector) {
      mockResults = $injector.get('searchResults');
      mockPaginatedResults = $injector.get('searchResultsPaginated');
      mockResultsFacets = $injector.get('searchResultsWithFacets');
    }));

    it('should handle search errors', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
        .respond(500, '');

      var searchContext = factory.newContext();

      var success;
      searchContext.search()
      .then(
        function() { success = true; },
        function() { success = false; }
      );
      $httpBackend.flush();

      expect( success ).toEqual(false);
    });

    it('should properly tag facets as active', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
        .respond(mockResultsFacets);

      var search = factory.newContext();
      var facets;

      search.selectFacet('my-facet', 'test')
      .search()
      .then(function(response){ facets = response.facets; });
      $httpBackend.flush();

      expect( facets['my-facet'].facetValues[0].selected ).toBeTruthy();
      expect( facets['my-facet'].facetValues[0].negated ).not.toBeTruthy();
      expect( facets['my-facet'].facetValues[1].selected ).not.toBeTruthy();
    });

    it('should properly tag NEGATED facets as active', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
        .respond(mockResultsFacets);

      var search = factory.newContext();
      var facets;

      search.selectFacet('my-facet', 'test', undefined, true)
      .search()
      .then(function(response){ facets = response.facets; });
      $httpBackend.flush();

      expect( facets['my-facet'].facetValues[0].selected ).toBeTruthy();
      expect( facets['my-facet'].facetValues[0].negated ).toBeTruthy();
      expect( facets['my-facet'].facetValues[1].selected ).not.toBeTruthy();
    });

    it('rewrites search results metadata correctly', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
        .respond(mockResults);

      var searchContext = factory.newContext(),
          actual;

      searchContext.search().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.results[0].metadata).toBeDefined();

      expect( _.isArray(actual.results[0].metadata.name.values) ).toBeTruthy();
      expect(actual.results[0].metadata.name['metadata-type']).toEqual('element');
      expect(actual.results[0].metadata.name.values.length).toBe(1);
      expect(actual.results[0].metadata.name.values[0]).toBe('Semantic News Search');

      expect( _.isArray(actual.results[0].metadata.series.values) ).toBeTruthy();
      expect(actual.results[0].metadata.series['metadata-type']).toEqual('element');
      expect(actual.results[0].metadata.series.values.length).toBe(2);
      expect(actual.results[0].metadata.series.values[0]).toBe('value1');
      expect(actual.results[0].metadata.series.values[1]).toBe('value2');
    });

    it('replaces Clark-notation namespaces with prefixes in search metadata', function() {
      var result = { 'metadata': [{'{http://example.com/ns}name':'Semantic News Search','metadata-type':'element'}] },
          mlSearch = factory.newContext();

      mlSearch.addNamespace({ prefix: 'ex', uri: 'http://example.com/ns' });
      mlSearch.transformMetadata(result);

      expect(result.metadata['{http://example.com/ns}name']).not.toBeDefined();
      expect(result.metadata['ex:name']).toBeDefined();
    });

    it('sets the page size correctly', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=5&start=6&structuredQuery=.*/)
        .respond(mockPaginatedResults);

      var searchContext = factory.newContext({
        options: 'all',
        pageLength: 5
      }),
      actual;

      // Go to the second page, with 5 results per page
      searchContext.setPage(2).search().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.start).toEqual(6);
      expect(actual['page-length']).toEqual(5);
    });

    it('sets the transform correctly', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=5&start=6&structuredQuery=.*&transform=blah/)
        .respond(mockPaginatedResults);

      var searchContext = factory.newContext({
        options: 'all',
        pageLength: 5
      }),
      actual;

      // Go to the second page, with 5 results per page
      searchContext.setPage(2).setTransform('blah').search().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.start).toEqual(6);
      expect(actual['page-length']).toEqual(5);
    });

  });

  describe('#facets', function () {

    it('selects facets correctly', function() {
      var searchContext = factory.newContext();
      // turn the structured query into a JSON string...
      var fullQuery = JSON.stringify(searchContext.selectFacet('foo', 'bar').getQuery());
      // ... grab the part I want and turn that back into JSON for easy access.
      var facetQuery = JSON.parse('{' + fullQuery.match(/"range-constraint-query":\s*{[^}]+}/)[0] + '}');

      expect(facetQuery['range-constraint-query']['constraint-name']).toEqual('foo');
      expect(Array.isArray(facetQuery['range-constraint-query'].value)).toBeTruthy();
      expect(facetQuery['range-constraint-query'].value.length).toEqual(1);
      expect(facetQuery['range-constraint-query'].value[0]).toEqual('bar');
    });

    it('selects negated facets correctly', function() {
      var searchContext = factory.newContext();
      var fullQuery = searchContext.selectFacet('foo', 'bar', undefined, true).getQuery();
      var facetQuery = fullQuery.query.queries[0]['and-query'].queries[0];

      expect(facetQuery['not-query']['range-constraint-query']['constraint-name']).toEqual('foo');
      expect(Array.isArray(facetQuery['not-query']['range-constraint-query'].value)).toBeTruthy();
      expect(facetQuery['not-query']['range-constraint-query'].value.length).toEqual(1);
      expect(facetQuery['not-query']['range-constraint-query'].value[0]).toEqual('bar');
    });

    it('clears a facet correctly', function() {
      var searchContext = factory.newContext();
      // make one facet selection:
      searchContext.selectFacet('foo', 'bar');
      // make another
      searchContext.selectFacet('cartoon', 'bugs bunny');
      var fullQuery = JSON.stringify(searchContext.getQuery());
      var fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).not.toBeNull();
      var cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).not.toBeNull();

      // now clear one selection:
      searchContext.clearFacet('foo', 'bar');

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).not.toBeNull();

      // and clear the other one:
      searchContext.clearFacet('cartoon', 'bugs bunny');

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).toBeNull();

      expect(searchContext.activeFacets.cartoon).not.toBeDefined();

      searchContext
        .selectFacet('foo', 'bar')
        .selectFacet('foo', 'baz');

      expect( searchContext.isFacetActive('foo', 'bar') ).toEqual(true);
      expect( searchContext.isFacetActive('foo', 'baz') ).toEqual(true);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(false);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(false);

      searchContext.clearFacet('foo', 'bar');

      expect( searchContext.isFacetActive('foo', 'bar') ).toEqual(false);
      expect( searchContext.isFacetActive('foo', 'baz') ).toEqual(true);

      searchContext.clearFacet('foo', 'baz');

      expect( searchContext.isFacetActive('foo', 'bar') ).toEqual(false);
      expect( searchContext.isFacetActive('foo', 'baz') ).toEqual(false);

      //Now to try negated facets
      searchContext
        .selectFacet('foo','bar', undefined, true)
        .selectFacet('foo','baz', undefined, true);

      expect( searchContext.isFacetActive('foo', 'bar') ).toEqual(true);
      expect( searchContext.isFacetActive('foo', 'baz') ).toEqual(true);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(true);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(true);

      searchContext.clearFacet('foo', 'bar');

      expect( searchContext.isFacetActive('foo', 'bar') ).toEqual(false);
      expect( searchContext.isFacetActive('foo', 'baz') ).toEqual(true);
      expect( searchContext.isFacetNegated('foo', 'bar') ).toEqual(false);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(true);

      searchContext.clearFacet('foo', 'baz');

      expect( searchContext.isFacetActive('foo', 'bar') ).toEqual(false);
      expect( searchContext.isFacetActive('foo', 'baz') ).toEqual(false);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(false);
      expect( searchContext.isFacetNegated('foo', 'baz') ).toEqual(false);

    });

    it('clears all facets correctly', function() {
      var fullQuery, fooQuery, cartoonQuery, comicQuery;
      var searchContext = factory.newContext();
      // make one facet selection:
      searchContext.selectFacet('foo', 'bar');
      // make another
      searchContext.selectFacet('cartoon', 'bugs bunny');
      // and a negative one
      searchContext.selectFacet('comic', 'spiderman', undefined, true);

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).not.toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).not.toBeNull();
      comicQuery = fullQuery.match(/"constraint-name":\s*"comic"/);
      expect(comicQuery).not.toBeNull();

      // clear both selections
      searchContext.clearAllFacets();

      fullQuery = JSON.stringify(searchContext.getQuery());
      fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
      expect(fooQuery).toBeNull();
      cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
      expect(cartoonQuery).toBeNull();
      comicQuery = fullQuery.match(/"constraint-name":\s*"comic"/);
      expect(comicQuery).toBeNull();

    });

    it('sets quoted value facets from parameters correctly', function() {
      var searchContext = factory.newContext();
      searchContext.results = {facets: {cartoon: {type: 'string', facetValues: [
        { value: 'bugs bunny', name: 'bugs bunny', count: 1 }
      ]}}};
      // select facet with space value
      searchContext.selectFacet('cartoon', 'bugs bunny');

      expect(searchContext.getParams().f[0]).toEqual('cartoon:"bugs bunny"');

      searchContext.fromParams(searchContext.getParams());
      $rootScope.$apply();

      expect(searchContext.getParams().f[0]).toEqual('cartoon:"bugs bunny"');

      expect(searchContext.activeFacets.cartoon.values[0].value).toEqual('bugs bunny');
    });

    it('should toggle facets', function() {
      var mlSearch = factory.newContext();
      mlSearch.results = {facets: {cartoon: {type: 'string', values: ['bugs bunny']}}};

      expect( mlSearch.isFacetActive('cartoon', 'bugs bunny') ).toEqual(false);

      mlSearch.toggleFacet('cartoon', 'bugs bunny');
      expect( mlSearch.isFacetActive('cartoon', 'bugs bunny') ).toEqual(true);

      mlSearch.toggleFacet('cartoon', 'bugs bunny');
      expect( mlSearch.isFacetActive('cartoon', 'bugs bunny') ).toEqual(false);
    });

    it('should annotate active facets', function() {
      var mlSearch = factory.newContext();
      mlSearch.results = {facets: {cartoon: {type: 'string', facetValues: [
        { value: 'bugs bunny', name: 'bugs bunny', count: 1 },
        { value: 'mickey', name: 'mickey', count: 1 }
      ]}}};

      mlSearch.annotateActiveFacets(mlSearch.results.facets);
      expect( _.filter(mlSearch.results.facets, 'selected').length ).toEqual(0);

      mlSearch.selectFacet('cartoon', 'mickey').annotateActiveFacets(mlSearch.results.facets);
      expect( _.filter(mlSearch.results.facets, 'selected').length ).toEqual(1);
    });

    it('should get facet query', function() {
      var mlSearch = factory.newContext();
      var facetQuery;

      mlSearch.selectFacet('color', 'red');

      facetQuery = mlSearch.getFacetQuery()['and-query'].queries[0]['range-constraint-query'];
      expect( facetQuery['constraint-name'] ).toEqual('color');
      expect( facetQuery.value[0] ).toEqual('red');

      mlSearch.clearAllFacets();

      mlSearch.activeFacets = { color: { values: [] } };
      expect( mlSearch.getFacetQuery()['and-query'].queries.length ).toEqual(0);
    });

    it('should get/set facet mode', function() {
      var mlSearch = factory.newContext();
      var facetQuery;

      mlSearch.selectFacet('color', 'red');

      expect(mlSearch.getFacetMode()).toBe('and');
      expect( mlSearch.getFacetQuery()['and-query'] ).toBeDefined();
      expect( mlSearch.getFacetQuery()['or-query'] ).not.toBeDefined();

      facetQuery = mlSearch.getFacetQuery()['and-query'].queries[0]['range-constraint-query'];
      expect( facetQuery['constraint-name'] ).toEqual('color');
      expect( facetQuery.value[0]).toEqual('red');

      expect(mlSearch.setFacetMode('or')).toBe(mlSearch);
      expect(mlSearch.getFacetMode()).toBe('or');
      expect( mlSearch.getFacetQuery()['and-query'] ).not.toBeDefined();
      expect( mlSearch.getFacetQuery()['or-query'] ).toBeDefined();

      facetQuery = mlSearch.getFacetQuery()['or-query'].queries[0]['range-constraint-query'];
      expect( facetQuery['constraint-name'] ).toEqual('color');
      expect( facetQuery.value[0]).toEqual('red');
    });

  });

  describe('#showMoreFacets', function(){
    var searchContext, constraintConfig, myFacet, myOtherFacet, extraFacets, extraExtraFacets;

    beforeEach(function() {
      searchContext = factory.newContext();
      constraintConfig = {
        options: {
          constraint: [{
            name: 'MyFacetName',
            range: { 'facet-option': 'limit=10' }
          }, {
            name: 'MyOtherFacetName',
            range: {}
          }]
        }
      };
      myFacet = {facetValues: []};
      extraFacets = {
        'values-response': {
          name: 'MyFacetName',
          type: 'xs:string',
          'distinct-value': [ {frequency: 10, _value: 'First'} ]
        }
      };
      myOtherFacet = {facetValues: []};
      extraExtraFacets = {
        'values-response': {
          name: 'MyOtherFacetName',
          type: 'xs:string',
          'distinct-value': [ {frequency: 2, _value: 'Other'} ]
        }
      };
    });

    it('returns additional facets correctly', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/MyFacetName?limit=5&start=1')
        .respond(extraFacets);

      searchContext.showMoreFacets(myFacet, 'MyFacetName');
      $httpBackend.flush();
      expect(myFacet.facetValues).toContain(
        {name: 'First', value: 'First', count: 10});

      $httpBackend
        .expectPOST('/v1/values/MyOtherFacetName?limit=5&start=1')
        .respond(extraExtraFacets);

      searchContext.showMoreFacets(myOtherFacet, 'MyOtherFacetName');
      $httpBackend.flush();
      expect(myOtherFacet.facetValues).toContain(
        {name: 'Other', value: 'Other', count: 2}
      );
    });

    it('returns `step` number of additional facets', function() {
      var myFacetValues = _.map(_.range(10), function(idx) {
        return { frequency: idx, _value: 'value-' + idx };
      });

      var myExtraFacets = _.clone(extraFacets);

      myExtraFacets['values-response']['distinct-value'] = _.take(myFacetValues, 5);

      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/MyFacetName?limit=5&start=1')
        .respond(extraFacets);

      searchContext.showMoreFacets(myFacet, 'MyFacetName');
      $httpBackend.flush();
      expect(myFacet.facetValues.length).toEqual(5);

      myExtraFacets['values-response']['distinct-value'] = myFacetValues;

      $httpBackend
        .expectPOST('/v1/values/MyFacetName?limit=15&start=6')
        .respond(myExtraFacets);

      searchContext.showMoreFacets(myFacet, 'MyFacetName', 10);
      $httpBackend.flush();
      expect(myFacet.facetValues.length).toEqual(15);
    });

    it('correctly uses saved queryOption', function() {
      searchContext.options.queryOptions = 'queryOption';
      $httpBackend
        .expectGET('/v1/config/query/queryOption?format=json')
        .respond(constraintConfig);

      $httpBackend
        .whenPOST('/v1/values/MyFacetName?limit=5&start=1')
        .respond(extraFacets);
      searchContext.showMoreFacets(myFacet, 'MyFacetName');
      $httpBackend.flush();
    });

    it('should reject when no matching constraints', function() {
      var emptyConstraintConfig = { options: { constraint: [] } };
      $httpBackend
        .whenGET('/v1/config/query/all?format=json')
        .respond(emptyConstraintConfig);

      var error;
      searchContext.showMoreFacets(myFacet, 'MyFacetName').catch(function(err) { error = err; });
      $httpBackend.flush();

      expect( error ).toEqual(new Error('No constraint exists matching MyFacetName'));
    });
  });

  describe('#getAggregates', function(){
    var searchContext, constraintConfig, myFacet, aggregateValues, mockResultsFacets;

    beforeEach(inject(function($injector) {
      searchContext = factory.newContext();
      mockResultsFacets = $injector.get('searchResultsWithFacets');
      constraintConfig = {
        options: {
          constraint: [{
            name: 'my-facet',
            range: { 'facet-option': 'limit=10' }
          }]
        }
      };
      myFacet = {facetValues: []};
      aggregateValues = {
        'values-response': {
          name: 'my-facet',
          type: 'xs:string',
          'aggregate-result': [{ name: 'count', _value: 1 }]
        }
      };
    }));

    it('returns no aggregates normally', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1.*/)
        .respond(mockResultsFacets);

      var searchContext = factory.newContext();
      var facets;

      searchContext
        .search()
        .then(function(response){ facets = response.facets; });
      $httpBackend.flush();

      expect( facets['my-facet'].count ).not.toBeDefined();
    });

    // this should be basically impossible, unless you're appending new facets manually
    it('should reject when no matching constraints', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond({ options: { constraint: [] } });

      var searchContext = factory.newContext();
      var success = false,
          error = null;

      searchContext.getAggregates( mockResultsFacets.facets )
        .then(
          function(){ success = true;  },
          function(err){ error = err; }
        );
      $httpBackend.flush();

      expect( error ).toEqual(new Error('No constraint exists matching my-facet'));
    });

    it('returns aggregates when enabled', function() {
      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1.*/)
        .respond(mockResultsFacets);
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/my-facet?limit=0&start=1')
        .respond(aggregateValues);

      var searchContext = factory.newContext({ includeAggregates: true });
      var facets;

      searchContext
        .search()
        .then(function(response){ facets = response.facets; });
      $httpBackend.flush();

      expect( facets['my-facet'].count ).toBeDefined();
    });

    it('returns numeric aggregates for numeric facets', function() {
      mockResultsFacets.facets['my-facet'] = {
        'type': 'xs:int',
        'facetValues': [
          { 'name': '2', 'count': 1, 'value': 2 },
          { 'name': '3', 'count': 2, 'value': 3 }
        ]
      };

      constraintConfig.options.constraint = [{
        name: 'my-facet',
        range: { 'facet-option': 'limit=10' }
      }];

      aggregateValues = {
        'values-response': {
          name: 'my-facet',
          type: 'xs:int',
          'aggregate-result': [
            { name: 'sum', _value: 5 },
            { name: 'avg', _value: 2.5 }
          ]
        }
      };

      $httpBackend
        .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1.*/)
        .respond(mockResultsFacets);
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(constraintConfig);
      $httpBackend
        .expectPOST('/v1/values/my-facet?limit=0&start=1')
        .respond(aggregateValues);

      var searchContext = factory.newContext({ includeAggregates: true });
      var facets;

      searchContext
        .search()
        .then(function(response){ facets = response.facets; });
      $httpBackend.flush();

      expect( facets['my-facet'].sum ).toBeDefined();
      expect( facets['my-facet'].sum ).toEqual(5);
      expect( facets['my-facet'].avg ).toBeDefined();
      expect( facets['my-facet'].avg ).toEqual(2.5);
    });
  });

  describe('#options/url-params', function() {
    var mockOptionsConstraint, mockOptionsGrammer, mockOptionsColor;

    beforeEach(inject(function($injector) {
      mockOptionsConstraint = $injector.get('optionsConstraint');
      mockOptionsColor = $injector.get('optionsConstraintColor');
      mockOptionsGrammer = $injector.get('optionsWithGrammer');
    }));

    it('gets stored options', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsGrammer);

      var search = factory.newContext(),
          actual;

      search.getStoredOptions().then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual).toEqual(mockOptionsGrammer);
    });

    it('gets all stored options', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      $httpBackend
        .expectGET('/v1/config/query/some?format=json')
        .respond(mockOptionsGrammer);

      var mlSearch = factory.newContext();
      var actual;

      mlSearch.getAllStoredOptions(['all', 'some']).then(function(response) { actual = response; });
      $httpBackend.flush();

      expect(actual.all).toEqual(mockOptionsColor);
      expect(actual.some).toEqual(mockOptionsGrammer);
    });

    it('gets combined query', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsGrammer);

      var search = factory.newContext(),
          actual;

      search.getCombinedQuery(true).then(function(response) { actual = response; });
      $httpBackend.flush();

      expect( actual.search.query ).toEqual( search.getQuery() );
      expect( actual.search.options ).toEqual( mockOptionsGrammer.options );

      search.storedOptions = {};
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(500, '');

      var success;
      search.getCombinedQuery(true)
      .then(
        function() { success = true; },
        function() { success = false; }
      );

      $httpBackend.flush();

      expect(success).toEqual(false);
    });

    it('should set search parameters', function() {
      var search = factory.newContext();

      expect(search.setText('blah').getParams().q).toEqual('blah');
      expect(search.setSort('yesterday').getParams().s).toEqual('yesterday');

      search = factory.newContext({
        params: {
          qtext: 'qtext',
          sort: 'orderby'
        }
      });

      expect(search.setText('blah').getParams().qtext).toEqual('blah');
      expect(search.setSort('yesterday').getParams().orderby).toEqual('yesterday');
      expect(search.selectFacet('name', 'value')).toBe(search);
      expect(search.getParams().f.length).toEqual(1);
      expect(search.getParams().f[0]).toEqual('name:value');
      expect(search.selectFacet('name', 'value2')).toBe(search);
      expect(search.getParams().f.length).toEqual(2);
      expect(search.getParams().f[1]).toEqual('name:value2');

      search.clearFacet('name','value');
      expect(search.getParams().f.length).toEqual(1);
      expect(search.selectFacet('name', 'value', undefined, true)).toBe(search);
      expect(search.getParams().f.length).toEqual(1);
      expect(search.getParams().n.length).toEqual(1);
      expect(search.getParams().n[0]).toEqual('name:value');
      expect(search.getParams().f[0]).toEqual('name:value2');
    });

    it('should respect null URL params config', function() {
      var search = factory.newContext();
      search.setText('text').setPage(4);

      expect(search.getParams().q).toEqual('text');
      expect(search.getParams().p).toEqual(4);

      search = factory.newContext({
        params: { page: null }
      });
      search.setText('text').setPage(4);

      expect(search.getParams().q).toEqual('text');
      expect(search.getParams().p).toBeUndefined();

      search = factory.newContext({
        params: { qtext: null }
      });
      search.setText('text').setPage(4);

      expect(search.getParams().q).toBeUndefined();
      expect(search.getParams().p).toEqual(4);
    });

    it('gets current URL params', function() {
      var mlSearch = factory.newContext();

      $location.search({ q: 'hi', f: 'color:blue', n: 'color:orange' });

      var params = mlSearch.getCurrentParams();

      expect( params.f ).toEqual( jasmine.any(Array) );
      expect( params.n ).toEqual( jasmine.any(Array) );
    });

    it('gets current URL params, regardless of name', function() {
      var mlSearch = factory.newContext({
        params: {
          facets: 'fac',
          negatedFacets: 'nfac'
        }
      });

      $location.search({ q: 'hi', fac: 'color:blue', nfac: 'color:orange' });

      var params = mlSearch.getCurrentParams();

      expect( params.fac ).toEqual( jasmine.any(Array) );
      expect( params.nfac ).toEqual( jasmine.any(Array) );
    });

    it('gets current URL params, regardless of name or prefix', function() {
      var mlSearch = factory.newContext({
        params: {
          prefix: 'blah',
          facets: 'fac',
          negatedFacets: 'nfac'
        }
      });

      $location.search({ 'blah:q': 'hi', 'blah:fac': 'color:blue', 'blah:nfac': 'color:orange' });

      var params = mlSearch.getCurrentParams();

      expect( params['blah:fac'] ).toEqual( jasmine.any(Array) );
      expect( params['blah:nfac'] ).toEqual( jasmine.any(Array) );
    });

    it('should populate from search parameters', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsConstraint);

      var search = factory.newContext({
        params: { separator: '*_*' }
      });

      $location.search({
        q: 'blah',
        s: 'backwards',
        p: '3',
        f : [ 'my-facet2*_*facetvalue' ],
        n : [ 'my-facet2*_*facetvalue2']
      });

      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('blah');
      expect(search.getSort()).toEqual('backwards');
      expect(search.getPage()).toEqual(3);
      expect(search.getActiveFacets()['my-facet2'].values[0].value).toEqual('facetvalue');
      expect(search.getActiveFacets()['my-facet2'].values[0].negated).toEqual(false);
      expect(search.getActiveFacets()['my-facet2'].values[1].value).toEqual('facetvalue2');
      expect(search.getActiveFacets()['my-facet2'].values[1].negated).toEqual(true);

      var sort = _.chain(search.getQuery().query.queries)
        .filter(function(obj) {
          return !!obj['operator-state'];
        }).filter(function(obj) {
          return obj['operator-state']['operator-name'] === 'sort';
        })
        .valueOf();

      expect(sort[0]).toEqual({
        'operator-state': {
          'operator-name': 'sort',
          'state-name': 'backwards'
        }
      });

      search.clearAllFacets();

      $location.search({
        q: 'blah2',
        s: 'backwards',
        p: '4',
        f : [ 'my-facet*_*facetvalue' ]
      });

      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('blah2');
      expect(search.getSort()).toEqual('backwards');
      expect(search.getPage()).toEqual(4);
      expect(search.getActiveFacets()['my-facet'].values[0].value).toEqual('facetvalue');
      expect(search.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);

      search.clearAllFacets();
      expect(search.getActiveFacets()['my-facet']).toBeUndefined();

      $location.search({
        q: 'blah2',
        p: '4',
        f : [
          'my-facet*_*facetvalue',
          'my-facet*_*facetvalue2'
        ]
      });

      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('blah2');
      expect(search.getSort()).toEqual('backwards');
      expect(search.getPage()).toEqual(4);
      expect(search.getActiveFacets()['my-facet'].values[0].value).toEqual('facetvalue');
      expect(search.getActiveFacets()['my-facet'].values[1].value).toEqual('facetvalue2');
      expect(search.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);
    });

    it('should handle untyped facets from URL params', function() {
      var mlSearch = factory.newContext();

      mlSearch.fromFacetParam('color:red');

      expect( mlSearch.isFacetActive('color', 'red') ).toEqual(true);
      expect( mlSearch.getActiveFacets().color.type ).toBeUndefined();
    });

    it('should handle typed facets from URL params', function() {
      var mlSearch = factory.newContext();

      mlSearch.fromFacetParam('my-facet:value', mockOptionsConstraint);
      expect( mlSearch.isFacetActive('my-facet', 'value') ).toEqual(true);
      expect( mlSearch.getActiveFacets()['my-facet'].type ).toEqual('xs:string');
      expect( mlSearch.getFacetParams().facets[0] ).toEqual('my-facet:value');
      expect( mlSearch.getFacetQuery()['and-query'].queries[0]['range-constraint-query'] ).toBeDefined();

      mlSearch.clearAllFacets();

      mlSearch.fromFacetParam('my-custom-facet:value', mockOptionsConstraint);
      expect( mlSearch.isFacetActive('my-custom-facet', 'value') ).toEqual(true);
      expect( mlSearch.getActiveFacets()['my-custom-facet'].type ).toEqual('custom');
      expect( mlSearch.getFacetParams().facets[0] ).toEqual('my-custom-facet:value');
      expect( mlSearch.getFacetQuery()['and-query'].queries[0]['custom-constraint-query'] ).toBeDefined();

      mlSearch.clearAllFacets();

      mlSearch.fromFacetParam('my-collection-facet:uri', mockOptionsConstraint);
      expect( mlSearch.isFacetActive('my-collection-facet', 'uri') ).toEqual(true);
      expect( mlSearch.getActiveFacets()['my-collection-facet'].type ).toEqual('collection');
      expect( mlSearch.getFacetParams().facets[0] ).toEqual('my-collection-facet:uri');
      expect( mlSearch.getFacetQuery()['and-query'].queries[0]['collection-constraint-query'] ).toBeDefined();
    });

    it('should populate from invalid page parameter', function() {
      var search = factory.newContext().setPage(10);

      expect(search.getPage()).toEqual(10);

      $location.search({ p: 'a' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getPage()).toEqual(1);
    });

    it('should ignore disabled URL params', function() {
      var search = factory.newContext().setPage(10);

      expect(search.getPage()).toEqual(10);

      search.fromParam('p', { p: 1 }, search.setPage);
      expect(search.getPage()).toEqual(1);

      search.setPage(10);
      expect(search.getPage()).toEqual(10);

      search.fromParam(null, { p: 1 }, search.setPage);
      expect(search.getPage()).toEqual(10);

      search = factory.newContext({
        params: { page: null }
      }).setPage(10);

      expect(search.getPage()).toEqual(10);

      $location.search({ p: 1});
      search.fromParams();
      $rootScope.$apply();

      expect(search.getPage()).toEqual(10);
    });

    it('should allow prefix\'d URL params', function() {
      var search = factory.newContext({
        params: { prefix: 'test' }
      });

      expect( search.getParamsPrefix() ).toEqual('test:');

      search
      .setText('hi')
      .setPage(3)
      .selectFacet('color', 'blue')
      .selectFacet('color', 'orange', undefined, true);

      expect(search.getText()).toEqual('hi');
      expect(search.getPage()).toEqual(3);
      expect(search.getActiveFacets().color.values[0].value).toEqual('blue');
      expect(search.getActiveFacets().color.values[1].value).toEqual('orange');
      expect(search.getActiveFacets().color.values[1].negated).toEqual(true);

      expect(search.getParams()['test:q']).toEqual('hi');
      expect(search.getParams()['test:p']).toEqual(3);
      expect(search.getParams()['test:f'][0]).toEqual('color:blue');
      expect(search.getParams()['test:n'][0]).toEqual('color:orange');
    });

    it('should allow prefix\'d URL params with custom prefixSeparator', function() {
      var search = factory.newContext({
        params: {
          prefix: 'test',
          prefixSeparator: '|'
        }
      });

      search
      .setText('hi')
      .setPage(3)
      .selectFacet('color', 'blue')
      .selectFacet('color','orange', undefined, true);

      expect(search.getText()).toEqual('hi');
      expect(search.getPage()).toEqual(3);
      expect(search.getActiveFacets().color.values[0].value).toEqual('blue');
      expect(search.getActiveFacets().color.values[1].value).toEqual('orange');
      expect(search.getActiveFacets().color.values[1].negated).toEqual(true);

      expect(search.getParams()['test|q']).toEqual('hi');
      expect(search.getParams()['test|p']).toEqual(3);
      expect(search.getParams()['test|f'][0]).toEqual('color:blue');
      expect(search.getParams()['test|n'][0]).toEqual('color:orange');
    });

    it('should populate from facet URL params without results', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      var search = factory.newContext();

      $location.search({ q: 'hi', f: 'color:blue', n: 'color:orange' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color.values[0].value).toEqual('blue');
      expect(search.getActiveFacets().color.values[0].negated).toEqual(false);
      expect(search.getActiveFacets().color.values[1].value).toEqual('orange');
      expect(search.getActiveFacets().color.values[1].negated).toEqual(true);

      $location.search({ q: 'hi' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color).toBeUndefined();
    });

    it('should populate from facet URL params with results', function() {
      var search = factory.newContext();

      search.results = {facets: {cartoon: {type: 'string', facetValues: [
        { value: 'bugs bunny', name: 'bugs bunny', count: 1 }
      ]}}};

      $location.search({ q: 'hi', f: 'cartoon:"bugs bunny"', n: 'cartoon:"donald duck"' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().cartoon.values[0].value).toEqual('bugs bunny');
      expect(search.getActiveFacets().cartoon.values[0].negated).toEqual(false);
      expect(search.getActiveFacets().cartoon.values[1].value).toEqual('donald duck');
      expect(search.getActiveFacets().cartoon.values[1].negated).toEqual(true);

      $location.search({ q: 'hi' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().cartoon).toBeUndefined();
    });

    it('should ignore prefix-mismatch facet URL params', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      var search = factory.newContext({
        params: { prefix: 'test' }
      });

      $location.search({ 'test:q': 'hi', 'test:f': 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color.values[0].value).toEqual('blue');

      // prefixed w/ custom separator use case
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      search = factory.newContext({
        params: {
          prefix: 'test',
          prefixSeparator: '|'
        }
      });

      $location.search({ 'test|q': 'hi', 'test|f': 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color.values[0].value).toEqual('blue');

      // prefix / unprefix'd
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      search = factory.newContext({
        params: {
          prefix: 'test',
          prefixSeparator: '|'
        }
      });

      $location.search({ q: 'hi', 'test|f': 'color:blue' });
      search.fromParams();
      $httpBackend.flush();

      expect(search.getText()).toBeNull();
      expect(search.getActiveFacets().color.values[0].value).toEqual('blue');

      // prefixed mis-match
      search = factory.newContext({
        params: {
          prefix: 'mytest',
          prefixSeparator: '|'
        }
      });

      $location.search({ 'mytest|q': 'hi', 'test|f': 'color:blue' });
      search.fromParams();
      $rootScope.$apply();

      expect(search.getText()).toEqual('hi');
      expect(search.getActiveFacets().color).toBeUndefined();
    });

    it('should handle URL params for multiple, concurrent searchContexts', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      $httpBackend
        .expectGET('/v1/config/query/some?format=json')
        .respond(mockOptionsColor);

      $httpBackend
        .expectGET('/v1/config/query/others?format=json')
        .respond(mockOptionsColor);

      var first = factory.newContext({
        params: { prefix: 'a' }
      });

      var second = factory.newContext({
        queryOptions: 'some',
        params: { prefix: 's' }
      });

      var third = factory.newContext({
        queryOptions: 'others',
        params: { prefix: 'x' }
      });

      $location.search({ 'a:f': 'color:red', 's:f': 'color:blue', 'x:f': 'color:green'});

      first.fromParams();
      second.fromParams();
      third.fromParams();

      $httpBackend.flush();

      expect(first.getActiveFacets().color.values[0].value).toEqual('red');
      expect(second.getActiveFacets().color.values[0].value).toEqual('blue');
      expect(third.getActiveFacets().color.values[0].value).toEqual('green');

      first.clearAllFacets();
      second.clearAllFacets();
      third.clearAllFacets();

      first.selectFacet('color', 'red');
      second.selectFacet('color', 'blue');
      third.selectFacet('color', 'green');

      var params = _.merge(first.getParams(), second.getParams(), third.getParams());

      expect(params['a:f'][0]).toEqual('color:red');
      expect(params['a:f'].length).toEqual(1);
      expect(params['s:f'][0]).toEqual('color:blue');
      expect(params['s:f'].length).toEqual(1);
      expect(params['x:f'][0]).toEqual('color:green');
      expect(params['x:f'].length).toEqual(1);
    });

    it('should handle location changes', function() {
      var mlSearch = factory.newContext();
      expect( mlSearch.getText() ).toBeNull();

      $location.search({ 'q': 'hi' });
      mlSearch.locationChange('/', '/');
      $rootScope.$apply();

      expect( mlSearch.getText() ).toEqual('hi');

      mlSearch.setText('');
      expect( mlSearch.getText() ).toBeNull();

      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      $location.search({ 'q': 'hi', 'f': 'color:blue', 'n':'color:orange' });
      mlSearch.locationChange('/', '/');
      $httpBackend.flush();

      expect( mlSearch.getText() ).toEqual('hi');
      expect( mlSearch.isFacetActive('color', 'blue') ).toEqual(true);
      expect( mlSearch.getActiveFacets().color.values[0].negated ).toEqual(false);
      expect( mlSearch.isFacetActive('color', 'orange') ).toEqual(true);
      expect( mlSearch.getActiveFacets().color.values[1].negated ).toEqual(true);

      var success;
      mlSearch.locationChange('/', '/')
      .then(
        function() { success = true; },
        function() { success = false; }
      );
      $rootScope.$apply();

      expect( success ).toEqual(false);
    });

    it('should handle location changes via argument', function() {
      $httpBackend
        .expectGET('/v1/config/query/all?format=json')
        .respond(mockOptionsColor);

      var mlSearch = factory.newContext();
      var params = { 'q': 'hi', 'f': 'color:blue', 'n':'color:orange' };

      mlSearch.locationChange('/', '/', params);
      $httpBackend.flush();

      expect( mlSearch.getText() ).toEqual('hi');
      expect( mlSearch.isFacetActive('color', 'blue') ).toEqual(true);
      expect( mlSearch.getActiveFacets().color.values[0].negated ).toEqual(false);
      expect( mlSearch.isFacetActive('color', 'orange') ).toEqual(true);
      expect( mlSearch.getActiveFacets().color.values[1].negated ).toEqual(true);

      var success;
      mlSearch.locationChange('/', '/', params)
      .then(
        function() { success = true; },
        function() { success = false; }
      );
      $rootScope.$apply();

      expect( success ).toEqual(false);
    });

  });

  it('gets suggests', function() {
    var suggestions = { suggestions : [
      'val1',
      'val2',
      'val3'
    ]};

    // regular call
    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val')
      .respond(suggestions);

    var search = factory.newContext(),
        actual1, actual2;

    search.suggest('val').then(function(response) { actual1 = response; });
    $httpBackend.flush();

    expect(actual1).toEqual(suggestions);

    // call with alt-options string
    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=alt-options&partial-q=val')
      .respond(suggestions);

    search.suggest('val', 'alt-options').then(function(response) { actual1 = response; });
    $httpBackend.flush();

    expect(actual1).toEqual(suggestions);

    // call with adhoc query object
    var allResults = {
      'term': {
        'empty': {
          'apply': 'all-results'
        }
      }
    };
    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val', function(body) {
        var json = JSON.parse(body);
        expect(json.search.options).toEqual(allResults);
        return true;
      })
      .respond(suggestions);

    search.suggest('val', allResults).then(function(response) { actual1 = response; });
    $httpBackend.flush();

    expect(actual1).toEqual(suggestions);

    // call with one response
    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val1')
      .respond({ suggestions: [ 'val1' ]});

    search.suggest('val1').then(function(response) { actual2 = response; });
    $httpBackend.flush();

    expect(actual2.suggestions.length).toEqual(1);
    expect(actual2.suggestions[0]).toEqual('val1');

    // exception handling
    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val1')
      .respond(500, '');

    var success;
    search.suggest('val1')
    .then(
      function() { success = true; },
      function() { success = false; }
    );
    $httpBackend.flush();

    expect( success ).toEqual(false);
  });

});

describe('MLSearchContext#mock-service', function () {
  'use strict';

  var factory, mockMLRest, mockResults, $rootScope, $q;

  var mockValues = {
    'values-response': {
      name: 'MyOtherFacetName',
      type: 'xs:string',
      'distinct-value': [ {frequency: 2, _value: 'Other'} ]
    }
  };

  var constraintConfig = {
      options: {
        constraint: [{
          name: 'my-facet',
          range: { 'facet-option': 'limit=10' }
        }]
      }
    };

  // fixture
  beforeEach(module('search-results-with-facets.json'));

  beforeEach(module('ml.search'));

  beforeEach(function() {
    mockMLRest = {
      search: jasmine.createSpy('search').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: mockResults });
        return d.promise;
      }),
      values: jasmine.createSpy('values').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: mockValues });
        return d.promise;
      }),
      queryConfig: jasmine.createSpy('queryConfig').and.callFake(function() {
        var d = $q.defer();
        d.resolve({ data: constraintConfig });
        return d.promise;
      })
    };
  });

  beforeEach(module(function($provide) {
    $provide.value('MLRest', mockMLRest);
  }));

  beforeEach(inject(function ($injector) {
    mockResults = $injector.get('searchResultsWithFacets');

    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope');
    factory = $injector.get('MLSearchFactory');
  }));

  it('should search with an adhoc combined query', function() {
    var mlSearch = factory.newContext();
    var count = 0;

    mlSearch.search({
      search: { query: {
        queries: [{
          'and-query': { queries: [] }
        }]
      } }
    }).then(function() { count++; });
    $rootScope.$apply();

    expect( count ).toEqual(1);
    expect( mockMLRest.search ).toHaveBeenCalled();

    var args = mockMLRest.search.calls.mostRecent().args;
    expect( args[0].options ).toBe(undefined);
    expect( args[0].start ).toEqual(1);
    expect( args[1].search ).not.toBe(undefined);
    expect( args[1].search.query ).not.toBe(undefined);
    expect( args[1].search.query.queries.length ).toEqual(1);
    expect( args[1].search.query.queries[0]['and-query'] ).not.toBe(undefined);
    expect( args[1].search.options ).toBe(undefined);

    expect( mlSearch.results ).toEqual({});
  });

  it('should construct an adhoc combined query with options and search', function() {
    var mlSearch = factory.newContext();
    var count = 0;

    mlSearch.search({
      options: {
        'return-facets': false,
        'return-metrics': true
      }
    }).then(function() { count++; });
    $rootScope.$apply();

    expect( count ).toEqual(1);
    expect( mockMLRest.search ).toHaveBeenCalled();

    var args = mockMLRest.search.calls.mostRecent().args;
    expect( args[0].options ).toBe(undefined);
    expect( args[0].start ).toEqual(1);
    expect( args[1].search ).not.toBe(undefined);
    expect( args[1].search.query ).not.toBe(undefined);
    expect( args[1].search.query.queries.length ).toEqual(2);
    expect( args[1].search.query.queries[0]['and-query'] ).not.toBe(undefined);
    expect( args[1].search.options ).not.toBe(undefined);
    expect( args[1].search.options['return-facets'] ).toEqual(false);
    expect( args[1].search.options['return-metrics'] ).toEqual(true);

    expect( mlSearch.results ).toEqual({});
  });

  it('should construct an adhoc combined query from a structured query and search', function() {
    var mlSearch = factory.newContext();
    var count = 0;

    mlSearch.search({
      query: { queries: [{
        'and-query': {
          queries: [
            { 'range-constraint-query': {
              'constraint-name': 'facet',
              'value': ['val']
            }},
            { 'collection-constraint-query': {
              'constraint-name': 'type',
              'uri': ['my-docs']
            }},
          ]
        }
      }]}
    }).then(function() { count++; });
    $rootScope.$apply();

    expect( count ).toEqual(1);
    expect( mockMLRest.search ).toHaveBeenCalled();

    var args = mockMLRest.search.calls.mostRecent().args;
    expect( args[0].options ).toEqual('all');
    expect( args[0].start ).toEqual(1);
    expect( args[1].search ).not.toBe(undefined);
    expect( args[1].search.query ).not.toBe(undefined);
    expect( args[1].search.query.queries.length ).toEqual(1);
    expect( args[1].search.query.queries[0]['and-query'] ).not.toBe(undefined);
    expect( args[1].search.query.queries[0]['and-query'].queries.length ).toEqual(2);
    expect( args[1].search.query.queries[0]['and-query'].queries[0]['range-constraint-query'] ).not.toBe(undefined);
    expect( args[1].search.query.queries[0]['and-query'].queries[1]['collection-constraint-query'] ).not.toBe(undefined);
    expect( args[1].search.options ).toBe(undefined);

    expect( mlSearch.results ).toEqual({});
  });

  it('should construct an adhoc combined query from specific options and search', function() {
    var mlSearch = factory.newContext();
    var count = 0;

    mlSearch.search({ 'return-facets': false }).then(function() { count++; });
    $rootScope.$apply();

    expect( count ).toEqual(1);
    expect( mockMLRest.search ).toHaveBeenCalled();

    var args = mockMLRest.search.calls.mostRecent().args;
    expect( args[0].options ).toEqual('all');
    expect( args[0].start ).toEqual(1);
    expect( args[1].search ).not.toBe(undefined);
    expect( args[1].search.query ).not.toBe(undefined);
    expect( args[1].search.query.queries.length ).toEqual(2);
    expect( args[1].search.query.queries[0]['and-query'] ).toBeDefined();
    expect( args[1].search.options ).not.toBe(undefined);
    expect( args[1].search.options['return-facets'] ).toEqual(false);

    expect( mlSearch.results ).toEqual({});
  });

  it('should get values', function() {
    var mlSearch = factory.newContext();

    var actual;
    mlSearch.values('MyOtherFacetName').then(function(response) { actual = response; });
    $rootScope.$apply();

    expect(actual['values-response'].name).toEqual('MyOtherFacetName');

    var args = mockMLRest.values.calls.mostRecent().args;
    expect(args[0]).toEqual('MyOtherFacetName');
    expect(args[1].start).toEqual(1);
    expect(args[1].limit).toEqual(20);
    expect(args[1].options).toEqual( mlSearch.getQueryOptions() );
  });

  it('should get values with combined query, without params', function() {
    var mlSearch = factory.newContext();

    var actual;
    mlSearch.values('MyOtherFacetName', {
      options: { values: { name:'MyOtherFacetName', 'values-option':'limit=10' }}
    }).then(function(response) { actual = response; });
    $rootScope.$apply();

    expect(actual['values-response'].name).toEqual('MyOtherFacetName');

    var args = mockMLRest.values.calls.mostRecent().args;
    expect(args[0]).toEqual('MyOtherFacetName');
    expect(args[1].start).toEqual(1);
    expect(args[1].limit).toEqual(20);
    expect(args[1].options).toBe(undefined);
  });

  it('should construct value options from constraint definition', function() {
    var mlSearch = factory.newContext({
      includeAggregates: true
    });

    mlSearch.search();
    $rootScope.$apply();

    var args = mockMLRest.values.calls.mostRecent().args;
    expect(args[0]).toEqual('my-facet');
    expect(args[1].start).toEqual(1);
    expect(args[1].limit).toEqual(0);

    expect( args[2].search.options.values[0]['values-option'] ).toEqual(
      constraintConfig.options.constraint[0].range['facet-option']
    );
  });

});

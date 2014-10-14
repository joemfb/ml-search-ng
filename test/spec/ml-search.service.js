/* global describe, beforeEach, module, it, expect, inject */

describe('MLRest', function () {
  'use strict';

  var factory, $httpBackend, $q;

  beforeEach(module('ml.search'));

  beforeEach(inject(function ($injector) {
    $q = $injector.get('$q');
    $httpBackend = $injector.get('$httpBackend');

    factory = $injector.get('MLSearchFactory', $q, $httpBackend);
  }));

  it('returns a search object', function() {
    var mlSearch = factory.newContext();
    expect(mlSearch.search()).toBeDefined;
  });

  it('sets the query text', function() {
    var mlSearch = factory.newContext();

    expect(mlSearch.getQuery().query.queries[0]['and-query'].queries.length).toEqual(0);
    expect(mlSearch.setText('test')).toBe(mlSearch);
    expect(mlSearch.getQuery().query.queries[0]['and-query'].queries.length).toEqual(1);
    expect(mlSearch.getQuery().query.queries[0]['and-query'].queries[0].qtext).toEqual('test');
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

  it('gets, sets, and clears sort', function() {
    // this test assumes that the sort operator is called "sort"; the service code
    // makes this assumption as well.

    var mlSearch = factory.newContext();

    expect(mlSearch.getSort()).toBe(null);
    expect(mlSearch.setSort('date')).toBe(mlSearch);
    expect(mlSearch.getSort()).toEqual('date');

    var operator = _.chain(mlSearch.getStructuredQuery().query.queries)
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

  it('gets, sets, and clears snipped', function() {
    var mlSearch = factory.newContext();

    expect(mlSearch.getSnippet()).toBe('compact');
    expect(mlSearch.setSnippet('full').getSnippet()).toBe('full');
    expect(mlSearch.clearSnippet().getSnippet()).toBe('compact');
  });

  it('initializes and gets queryOptions', function() {
    var mlSearch = factory.newContext();

    expect(mlSearch.getQueryOptions()).toBe('all');

    mlSearch = factory.newContext({ queryOptions: 'some' });
    expect(mlSearch.getQueryOptions()).toBe('some');

    mlSearch = factory.newContext({ queryOptions: null });
    expect(mlSearch.getQueryOptions()).toBeNull();
  });


  it('rewrites search results metadata correctly', function() {
    $httpBackend
      .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
      .respond({
        'snippet-format': 'snippet',
        'total': 13,
        'start': 1,
        'page-length': 1,
        'results':[
          {
            'index': 1,
            'uri': '/demos/17380453717445161293.json',
            'path': 'fn:doc(\"/demos/17380453717445161293.json\")',
            'score': 0,
            'confidence': 0,
            'fitness': 0,
            'href': '/v1/documents?uri=%2Fdemos%2F17380453717445161293.json',
            'mimetype': 'application/json',
            'format': 'json',
            'matches': [{'path':'fn:doc(\"/demos/17380453717445161293.json\")/jbasic:json','match-text':['Semantic News Search This use case aims to demonstrate a combination of MarkLogic\'s built-in full-text XQuery XML content search and SPARQL...']}],
            'metadata': [{'name':'Semantic News Search','metadata-type':'element'}]
          }
        ],
        'query': {'and-query':[]}
      });

    var searchContext = factory.newContext(),
        actual;

    searchContext.search().then(function(response) { actual = response; });
    $httpBackend.flush();

    expect(actual.results[0].metadata).toBeDefined();
    expect( _.isArray(actual.results[0].metadata.name.values) ).toBeTruthy();
    expect(actual.results[0].metadata.name.values[0]).toBe('Semantic News Search');
    expect(actual.results[0].metadata.name['metadata-type']).toEqual('element');
  });

  it('sets the page size correctly', function() {
    $httpBackend
      .expectGET(/\/v1\/search\?format=json&options=all&pageLength=5&start=6&structuredQuery=.*/)
      .respond({
        'total': 13,
        'start': 6,
        'page-length': 5,
        'results':[
          // not relevant to test
        ],
        'query': {'and-query':[]}
      });


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

  it('selects facets correctly', function() {
    var searchContext = factory.newContext();
    // turn the structured query into a JSON string...
    var fullQuery = JSON.stringify(searchContext.selectFacet('foo', 'bar').getStructuredQuery());
    // ... grab the part I want and turn that back into JSON for easy access.
    var facetQuery = JSON.parse('{' + fullQuery.match(/"range-constraint-query":\s*{[^}]+}/)[0] + '}');

    expect(facetQuery['range-constraint-query']['constraint-name']).toEqual('foo');
    expect(Array.isArray(facetQuery['range-constraint-query'].value)).toBeTruthy();
    expect(facetQuery['range-constraint-query'].value.length).toEqual(1);
    expect(facetQuery['range-constraint-query'].value[0]).toEqual('bar');
  });

  it('clears a facet correctly', function() {
    var searchContext = factory.newContext();
    // make one facet selection:
    searchContext.selectFacet('foo', 'bar');
    // make another
    searchContext.selectFacet('cartoon', 'bugs bunny');
    var fullQuery = JSON.stringify(searchContext.getStructuredQuery());
    var fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
    expect(fooQuery).not.toBeNull();
    var cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
    expect(cartoonQuery).not.toBeNull();

    // now clear one selection:
    searchContext.clearFacet('foo', 'bar');

    fullQuery = JSON.stringify(searchContext.getStructuredQuery());
    fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
    expect(fooQuery).toBeNull();
    cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
    expect(cartoonQuery).not.toBeNull();

    // and clear the other one:
    searchContext.clearFacet('cartoon', 'bugs bunny');

    fullQuery = JSON.stringify(searchContext.getStructuredQuery());
    fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
    expect(fooQuery).toBeNull();
    cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
    expect(cartoonQuery).toBeNull();

  });

  it('clears all facets correctly', function() {
    var fullQuery, fooQuery, cartoonQuery;
    var searchContext = factory.newContext();
    // make one facet selection:
    searchContext.selectFacet('foo', 'bar');
    // make another
    searchContext.selectFacet('cartoon', 'bugs bunny');

    fullQuery = JSON.stringify(searchContext.getStructuredQuery());
    fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
    expect(fooQuery).not.toBeNull();
    cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
    expect(cartoonQuery).not.toBeNull();

    // clear both selections
    searchContext.clearAllFacets();

    fullQuery = JSON.stringify(searchContext.getStructuredQuery());
    fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
    expect(fooQuery).toBeNull();
    cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
    expect(cartoonQuery).toBeNull();

  });

  it('should populate from search parameters', function() {
    var search = factory.newContext();

    expect(search.setText('blah').getParams().q).toEqual('blah');
    expect(search.setSort('yesterday').getParams().s).toEqual('yesterday');

    var search = factory.newContext({
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
  });

  it('should populate from search parameters', function() {
    var search = factory.newContext({
      params: { separator: '*_*' }
    });

    search.fromParams({
      q: 'blah',
      s: 'backwards',
      p: '3',
      f : [ 'my-facet2*_*facetvalue' ]
    });

    expect(search.getText()).toEqual('blah');
    expect(search.getSort()).toEqual('backwards');
    expect(search.getPage()).toEqual(3);

    var sort = _.chain(search.getStructuredQuery().query.queries)
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

    search.fromParams({
      q: 'blah2',
      s: 'backwards',
      p: '4',
      f : [ 'my-facet*_*facetvalue' ]
    });

    expect(search.getText()).toEqual('blah2');
    expect(search.getSort()).toEqual('backwards');
    expect(search.getPage()).toEqual(4);
    expect(search.getStructuredQuery().query.queries[0]['and-query'].queries.length).toEqual(2);

    search.clearAllFacets();

    search.fromParams({
      q: 'blah2',
      p: '4',
      f : [
        'my-facet*_*facetvalue',
        'my-facet*_*facetvalue2'
      ]
    });
    expect(search.getText()).toEqual('blah2');
    expect(search.getSort()).toEqual('backwards');
    expect(search.getPage()).toEqual(4);
    expect(search.getStructuredQuery().query.queries[0]['and-query'].queries.length).toEqual(2);
  });


});

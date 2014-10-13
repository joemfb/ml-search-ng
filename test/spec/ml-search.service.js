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

  it('sets the sort operator correctly', function() {
    // this test assumes that the sort operator is called "sort"; the service code
    // makes this assumption as well.
    var searchContext = factory.newContext(),
        actual;

    actual = searchContext.setSort('blah').getStructuredQuery();
    expect(actual).toMatch({'operator-state':{'operator-name':'sort','state-name':'blah'}});
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

});

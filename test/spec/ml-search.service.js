/* global describe, beforeEach, module, it, expect, inject */

describe('MLSearch', function () {
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

    // console.log(_.keys( Object.getPrototypeOf(mlSearch) ))
  });

  it('has a query builder', function() {
    var mlSearch = factory.newContext(),
        qb = mlSearch.qb;

    expect(qb).not.toBeNull;
  });

  it('gets active facets', function() {
    var mlSearch = factory.newContext(),
        actual;

    mlSearch.selectFacet('name', 'value');
    actual = mlSearch.getActiveFacets();

    expect(actual.name).toBeDefined;
    expect(actual.name.values.length).toEqual(1);
    expect(actual.name.values[0]).toEqual('value');
  });

  it('gets and sets boostQueries', function() {
    var mlSearch = factory.newContext(),
        qb = mlSearch.qb,
        boost = qb.boost(qb.and(), qb.and());
    mlSearch.addBoostQuery(boost);

    expect(mlSearch.getBoostQueries().length).toEqual(1);
    expect(mlSearch.getBoostQueries()[0]).toEqual(boost);

    mlSearch.clearBoostQueries();

    expect(mlSearch.getBoostQueries().length).toEqual(0);
  });

  it('gets and sets search transform', function() {
    var mlSearch = factory.newContext();

    expect(mlSearch.getTransform()).toBeNull();
    expect(mlSearch.setTransform('test')).toBe(mlSearch);
    expect(mlSearch.getTransform()).toEqual('test');
  });

  it('sets the query text', function() {
    var mlSearch = factory.newContext();

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

    mlSearch = factory.newContext({ snippet: 'full' });

    expect(mlSearch.getSnippet()).toBe('full');
    expect(mlSearch.setSnippet('partial')).toBe(mlSearch);
    expect(mlSearch.getSnippet()).toBe('partial');

    expect(mlSearch.clearSnippet()).toBe(mlSearch);
    expect(mlSearch.getSnippet()).toBe('compact');

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

  it('gets and sets facet mode', function() {
    var mlSearch = factory.newContext();

    expect(mlSearch.getFacetMode()).toBe('and');
    expect(mlSearch.setFacetMode('or')).toBe(mlSearch);
    expect(mlSearch.getFacetMode()).toBe('or');

    //TODO: getQuery()
  });

  it('gets URL params config', function() {
    var mlSearch = factory.newContext();

    expect(mlSearch.getParamsConfig()).not.toBeNull;
    expect(mlSearch.getParamsConfig().separator).toEqual(':');
    expect(mlSearch.getParamsConfig().qtext).toEqual('q');
    expect(mlSearch.getParamsConfig().facets).toEqual('f');
    expect(mlSearch.getParamsConfig().sort).toEqual('s');
    expect(mlSearch.getParamsConfig().page).toEqual('p');

    // TODO: test with options
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
    var fullQuery = JSON.stringify(searchContext.selectFacet('foo', 'bar').getQuery());
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

  });

  it('clears all facets correctly', function() {
    var fullQuery, fooQuery, cartoonQuery;
    var searchContext = factory.newContext();
    // make one facet selection:
    searchContext.selectFacet('foo', 'bar');
    // make another
    searchContext.selectFacet('cartoon', 'bugs bunny');

    fullQuery = JSON.stringify(searchContext.getQuery());
    fooQuery = fullQuery.match(/"constraint-name":\s*"foo"/);
    expect(fooQuery).not.toBeNull();
    cartoonQuery = fullQuery.match(/"constraint-name":\s*"cartoon"/);
    expect(cartoonQuery).not.toBeNull();

    // clear both selections
    searchContext.clearAllFacets();

    fullQuery = JSON.stringify(searchContext.getQuery());
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

    search.fromParams({
      q: 'blah2',
      s: 'backwards',
      p: '4',
      f : [ 'my-facet*_*facetvalue' ]
    });

    expect(search.getText()).toEqual('blah2');
    expect(search.getSort()).toEqual('backwards');
    expect(search.getPage()).toEqual(4);
    //TODO: mock options
    //expect(search.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);

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
    //TODO: mock options
    // expect(search.getQuery().query.queries[0]['and-query'].queries.length).toEqual(2);
  });

  it('gets stored options', function() {
    var options = {"options":{"concurrency-level":8, "debug":false, "page-length":10, "search-option":["score-logtfidf"], "quality-weight":1, "return-aggregates":true, "return-constraints":false, "return-facets":true, "return-frequencies":true, "return-qtext":true, "return-query":false, "return-results":true, "return-metrics":true, "return-similar":false, "return-values":true, "transform-results":{"apply":"snippet", "per-match-tokens":"30", "max-matches":"4", "max-snippet-chars":"200", "preferred-elements":""}, "searchable-expression":{"text":"fn:collection()"}, "sort-order":[{"direction":"descending", "score":null}], "term":{"apply":"term", "empty":{"apply":"all-results"}}, "grammar":{"quotation":"\"", "implicit":"<cts:and-query strength=\"20\" xmlns=\"http:\/\/marklogic.com\/appservices\/search\" xmlns:cts=\"http:\/\/marklogic.com\/cts\"\/>", "starter":[{"strength":"30", "apply":"grouping", "delimiter":")", "label":"("}, {"strength":"40", "apply":"prefix", "cts-element":"cts:not-query", "label":"-"}], "joiner":[{"strength":"10", "apply":"infix", "cts-element":"cts:or-query", "tokenize":"word", "label":"OR"}, {"strength":"20", "apply":"infix", "cts-element":"cts:and-query", "tokenize":"word", "label":"AND"}, {"strength":"30", "apply":"infix", "cts-element":"cts:near-query", "tokenize":"word", "label":"NEAR"}, {"strength":"30", "apply":"near2", "consume":"2", "cts-element":"cts:near-query", "label":"NEAR\/"}, {"strength":"32", "apply":"boost", "cts-element":"cts:boost-query", "tokenize":"word", "label":"BOOST"}, {"strength":"35", "apply":"not-in", "cts-element":"cts:not-in-query", "tokenize":"word", "label":"NOT_IN"}, {"strength":"50", "apply":"constraint", "label":":"}, {"strength":"50", "apply":"constraint", "compare":"LT", "tokenize":"word", "label":"LT"}, {"strength":"50", "apply":"constraint", "compare":"LE", "tokenize":"word", "label":"LE"}, {"strength":"50", "apply":"constraint", "compare":"GT", "tokenize":"word", "label":"GT"}, {"strength":"50", "apply":"constraint", "compare":"GE", "tokenize":"word", "label":"GE"}, {"strength":"50", "apply":"constraint", "compare":"NE", "tokenize":"word", "label":"NE"}]}}};

    $httpBackend
      .expectGET('/v1/config/query/all?format=json')
      .respond(options);

    var search = factory.newContext(),
        actual;

    search.getStoredOptions().then(function(response) { actual = response; });
    $httpBackend.flush();

    expect(actual).toEqual(options);
  });

  it('gets suggests', function() {
    var suggestions = {"suggestions" : [
      "val1",
      "val2",
      "val3"
    ]};

    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val')
      .respond(suggestions);

    var search = factory.newContext(),
        actual1, actual2;

    search.suggest('val').then(function(response) { actual1 = response });
    $httpBackend.flush();

    expect(actual1).toEqual(suggestions);

    $httpBackend
      .expectPOST('/v1/suggest?format=json&options=all&partial-q=val1')
      .respond({"suggestions" : [ "val1" ]});

    search.suggest('val1').then(function(response) { actual2 = response });
    $httpBackend.flush();

    expect(actual2.suggestions.length).toEqual(1);
    expect(actual2.suggestions[0]).toEqual('val1');
  });

  it('should properly tag facets as active', function() {
    var cannedResponse = {
      'snippet-format': 'snippet',
      total: 1,
      start: 1,
      'page-length': 10,
      results: [
        {
          index: 1,
          uri: '/object/master/cffb60cb-ddc1-4608-bab0-dd233907b60c.xml',
          path: 'fn:doc("/object/master/cffb60cb-ddc1-4608-bab0-dd233907b60c.xml")',
          score: 0,
          confidence: 0,
          fitness: 0,
          href: '/v1/documents?uri=%2Fobject%2Fmaster%2Fcffb60cb-ddc1-4608-bab0-dd233907b60c.xml',
          mimetype: 'text/xml',
          format: 'xml',
          matches: [
          {
            path: 'fn:doc("/object/master/cffb60cb-ddc1-4608-bab0-dd233907b60c.xml")/*:object',
            'match-text': [
              'cffb60cb-ddc1-4608-bab0-dd233907b60c cffb60cb-ddc1-4608-bab0-dd233907b60c http://purl.org/dc/elements/1.1/title Joe Hunter Joe Hunter Ruby JavaScript Java JavaScript Java Bachelor\'s M Payroll...'
            ]
          }],
          metadata: {}
        }
      ],
      facets: {
        'my-facet': {
          type: 'xs:string',
          facetValues: [
            {
              name: 'test',
              count: 1,
              value: 'test'
            },
            {
              name: 'test2',
              count: 2,
              value: 'test2'
            }
          ]
        }
      },
      qtext: '',
      metrics: {
        'query-resolution-time': 'PT0.002562S',
        'facet-resolution-time': 'PT0.000069S',
        'snippet-resolution-time': 'PT0.003802S',
        'total-time': 'PT0.007772S'
      },
      page: 1,
      totalPages: 1,
      end: 1
    };

    $httpBackend
      .expectGET(/\/v1\/search\?format=json&options=all&pageLength=10&start=1&structuredQuery=.*/)
      .respond(cannedResponse);

    var search = factory.newContext();

    search.selectFacet('my-facet', 'test').search().then(function(response){
      expect(response.facets['my-facet'].facetValues[0].selected).toByTruthy;
      expect(response.facets['my-facet'].facetValues[1].selected).not.toByTruthy;
    });

    $httpBackend.flush();
  });


});

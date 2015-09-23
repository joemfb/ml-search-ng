### ml-search-ng

[![Build Status](https://travis-ci.org/joemfb/ml-search-ng.svg?branch=master)](https://travis-ci.org/joemfb/ml-search-ng)
[![Coverage Status](https://coveralls.io/repos/joemfb/ml-search-ng/badge.svg?branch=master&service=github)](https://coveralls.io/github/joemfb/ml-search-ng?branch=master)

An angular module of services and directives for common use cases in MarkLogic search applications. Based on components from ealier versions of [https://github.com/marklogic/slush-marklogic-node](https://github.com/marklogic/slush-marklogic-node).

depends on [https://github.com/joemfb/ml-common-ng](https://github.com/joemfb/ml-common-ng).

#### getting started

    bower install ml-search-ng

#### services

- `MLSearchFactory`: factory for generating instances of `MLSearchContext` (which manages search config/query state, and provides APIs for searches)
- `MLRemoteInputService`: for communicating with the `ml-remote-input` (search input outside of controller scope)

#### directives

- `ml-chiclets`: display facet selection 'chiclets'
- `ml-duration`: parse ISO duration strings
- `ml-facets`: display facets
- `ml-input`: search input with auto-suggest
- `ml-metrics`: display search metrics
- `ml-remote-input`: remote wrapper for `ml-input`
- `ml-results`: display search results / snippets / highlights

#### controllers

- `MLSearchController`: prototypically inherit to setup default search behavior
- `MLRemoteSearchController`: prototypically inherit to use with `ml-remote-input` (inherits from `MLSearchController`)

See [https://joemfb.github.io/ml-search-ng/](https://joemfb.github.io/ml-search-ng/) for API docs and directive examples.

See [https://github.com/marklogic/slush-marklogic-node](https://github.com/marklogic/slush-marklogic-node) for a quick way to get started with an angular search application on top of the MarkLogic REST API.

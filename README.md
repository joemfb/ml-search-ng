### ml-search-ng

An angular module for common search application use cases. Based on components from https://github.com/marklogic/slush-marklogic-node.

#### MLSearch service

`// TODO: document methods`

To get an instance, inject `MLSearchFactory`, and invoke `searchFactory.newContext()`

#### Directives

##### ml-input

A search-input form.

attributes:

- `qtext`: a reference to the model property containing the search phrase
- `search`: a function reference. The function will be called with a parameter named `qtext`
- `suggest`: a function reference. The function will be called with a parameter named `val`
- `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used. If `"fa"`, a bootstrap/font-awesome template will be used. **Note: the `"fa"` template _requires_ bootstrap 3.2.0 or greater.**

Example:

    <ml-input qtext="model.qtext" search="search(qtext)" suggest="suggest(val)"></ml-input>

##### ml-remote-input

A search-input form, outside of the scope of a controller. Uses `MLRemoteInputService` to communicate with a controller. Wraps `ml-input`.

attributes:

- `searchCtrl`: the name of the controller to interface with. defaults to `'SearchCtrl'`
- `template`: passed to `ml-input`

Example:

    <ml-remote-input search-ctrl="MySearchCtrl" template="fa"></ml-remote-input>

In the controller:

    remoteInput.initCtrl($scope, model, mlSearch, search);

Note: this function assumes mlSearch is an MLSearch context, search is a function, and model has a `qtext` property. If these assumptions don't hold, a more verbose approach is required:

`// TODO: complex example`

##### ml-facets

Display facets

attributes:

- `facets`: a references to the `facets` property of the response object from `MLSearch.search()`
- `toggle`: a reference to a function that will select or clear facets based on their state. Invoked with `facet` (name) and `value` parameters. This function should invoke `mlSearch.toggleFacet(facetName, value).search()`
- `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used (chiclet-style facets). If `"inline"`, a bootstrap/font-awesome template will be used (inline facet selections)

Example:

    <ml-facets facets="model.search.facets" toggle="toggleFacet(facet, value)"></ml-facets>

##### ml-results

Displays search results. Binds a `link` property to each result object, based on the result of the function passed to the `link` attribute. If no function is passed a default function is provided. The resulting `link` property will have the form `/detail?uri={{ result.uri }}`

attributes:

- `results`: a reference to the `results` property of the response object from `MLSearch.search()`
- `link`: optional. a function that accepts a `result` object, and returns a URL to be used as the link target in the search results display
- `template`: optional. A URL referencing a template to be used with the directive. If empty, the default bootstrap template will be used.

Example:

    <ml-results results="model.search.results" link="linkTarget(result)"></ml-results>

##### ml-metrics

Displays search metrics

attributes:

- `search`: a reference to the response object from `MLSearch.search()`
- `showDuration`: optional boolean. defaults to `true`

The following scope properties are bound:

- `total`: The total number of search results
- `start`: The index of the first displayed search result
- `pageLength`: The length of the search results page
- `pageEnd`: the index of the last displayed search result
- metrics: a reference to the `metrics` property of the response object passed to the `search` attribute

Example:

    <ml-metrics search="model.search"></ml-metrics>

Transclusion Example:

    <ml-metrics search="model.search">
      Showing {{ pageLength }} results in
      <span ml-duration="metrics['total-time']">{{ duration.seconds | number:2 }}</span>
      seconds.
    </ml-metrics>

##### ml-duration

Attribute directive that parses ISO duration (xs:duration) strings and creates a new scope with the following properties:

- `years`
- `months`
- `weeks`
- `days`
- `hours`
- `minutes`
- `seconds`
- `toString`: a function that returns the original text serialization of the duration

Example: see `ml-metrics` example.

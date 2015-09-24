(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-chiclets.html',
    '<div class="chiclets"><div ng-repeat="(index, facet) in activeFacets | object2Array"><div class="btn btn-primary chiclet" ng-repeat="value in facet.values | filter:{negated:false}"><span title="{{ value.value }}">{{ facet.__key }}: {{ value.value | truncate:truncateLength }}</span> <span class="glyphicon glyphicon-remove-circle icon-white" ng-click="toggle({facet: facet.__key, value: value.value})"></span></div><div class="btn btn-warning chiclet negated" ng-repeat="value in facet.values | filter:{negated:true}"><span title="{{ value.value }}">{{ facet.__key }}: {{ value.value | truncate:truncateLength }}</span> <span class="glyphicon glyphicon-remove-circle icon-white" ng-click="toggle({facet: facet.__key, value: value.value})"></span></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-facets-inline.html',
    '<div class="facet-list"><div class="facet" ng-if="facet.facetValues.length" ng-repeat="(index, facet) in facets | object2Array"><h3>{{ facet.__key }}</h3><div ng-repeat="value in facet.facetValues" ng-class="{ \'on\': value.selected}"><a ng-click="toggle({facet: facet.__key, value: value.name})" title="{{ value.name }}"><i ng-class="{ \'fa fa-trash-o\': value.selected }"></i> <span ng-if="!!value.name">{{ value.name | truncate:truncateLength }}</span> <em ng-if="!value.name">blank</em></a> <span>({{ value.count }})</span></div><div ng-if="shouldShowMore &amp;&amp; !facet.displayingAll"><a href="" ng-click="showMore({facet: facet, facetName: facet.__key})">see more ...</a></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-facets.html',
    '<div class="facet-list"><ml-chiclets ng-if="shouldNegate" active-facets="activeFacets" toggle="toggle({facet:facet, value:value})" truncate="truncateLength"></ml-chiclets><div class="chiclets" ng-if="!shouldNegate"><div ng-repeat="(index, facet) in facets | object2Array | filter:{selected: true}"><div class="btn btn-primary" ng-repeat="value in facet.facetValues | filter:{selected: true}"><span title="{{ value.name }}">{{ facet.__key }}: {{ value.name | truncate:truncateLength }}</span> <span class="glyphicon glyphicon-remove-circle icon-white" ng-click="toggle({facet: facet.__key, value: value.name})"></span></div></div></div><div class="facet" ng-if="filter(facet.facetValues, {selected: \'!\'+true}, false).length" ng-repeat="(index, facet) in facets | object2Array"><h3>{{ facet.__key }}</h3><div ng-repeat="value in facet.facetValues | filter:{selected: \'!\'+true}:false"><i class="fa fa-plus-circle facet-add-pos" ng-click="toggle({facet: facet.__key, value: value.name})" title="{{ value.name }}"></i> <span ng-if="!!value.name">{{ value.name | truncate:truncateLength }}</span> <em ng-if="!value.name">blank</em> <span>({{ value.count }})</span> <i class="fa fa-ban facet-add-neg" ng-if="shouldNegate" ng-click="negate({facet: facet.__key, value: value.name})" title="{{ value.name }}"></i></div><div ng-if="shouldShowMore &amp;&amp; !facet.displayingAll"><a href="" ng-click="showMore({facet: facet, facetName: facet.__key})">see more ...</a></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-input-fa.html',
    '<form ng-submit="search({ qtext: qtext })" class="ml-input ml-search form-inline" role="search"><div class="input-group"><input ng-model="qtext" type="text" class="form-control" placeholder="Search..." autocomplete="off" typeahead="suggestion for suggestion in suggest({ val: $viewValue })" typeahead-suggest-on-select="true" typeahead-loading="loadingSuggestions"> <span ng-show="qtext" ng-click="clear()" class="search-input-icon search-input-clear form-control-feedback"><i class="fa fa-times-circle"></i></span> <span ng-show="loadingSuggestions" class="search-input-icon search-loading form-control-feedback"><i class="fa fa-refresh fa-spin"></i></span><div ng-click="search({ qtext: qtext })" class="input-group-addon search-submit"><i class="fa fa-search"></i></div></div></form>');
}]);
})();

(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-input.html',
    '<form class="ml-search form-inline" role="search"><div class="form-group"><input ng-model="qtext" type="text" class="form-control" placeholder="Search..." autocomplete="off" typeahead="suggestion for suggestion in suggest({ val: $viewValue })" typeahead-loading="loadingSuggestions"></div><button type="submit" class="btn btn-default" ng-click="search({ qtext: qtext })"><span class="glyphicon glyphicon-search"></span></button> <button type="reset" class="btn btn-default" ng-show="qtext" ng-click="clear()"><span class="glyphicon glyphicon-remove"></span></button> <span ng-show="loadingSuggestions" class="glyphicon glyphicon-refresh"></span></form>');
}]);
})();

(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-metrics.html',
    '<div ng-show="total > 0" class="ml-metrics search-metrics">Showing {{ start }}-{{ pageEnd }} of {{ total }}<span ng-hide="showDuration">.</span> <span ng-show="showDuration" ml-duration="metrics[\'total-time\']"><span>in {{ duration.seconds | number:3 }} seconds.</span></span></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('ml.search.tpls');
} catch (e) {
  module = angular.module('ml.search.tpls', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('/templates/ml-results.html',
    '<div ng-repeat="result in results"><h4><a ng-href="{{ result.link }}">{{ result.label || result.uri }}</a></h4><div class="matches"><div class="match" ng-repeat="match in result.matches"><em ng-repeat="text in match[\'match-text\'] track by $index"><span ng-class="{ highlight: !!text.highlight }">{{ text.highlight || text }}</span></em></div></div><hr></div>');
}]);
})();

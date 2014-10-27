(function () {

  'use strict';

  angular.module('ml.search')
    .directive('mlFacets', mlFacets);

  function mlFacets() {
    return {
      restrict: 'E',
      scope: {
        facets: '=',
        toggle: '&'
      },
      templateUrl: template
    };
  }

  function template(element, attrs) {
    var url;

    if (attrs.template) {
      if (attrs.template === 'inline') {
        url = '/templates/ml-facets-inline.html';
      } else {
        url = attrs.template;
      }
    }
    else {
      url = '/templates/ml-facets.html';
    }

    return url;
  }

}());

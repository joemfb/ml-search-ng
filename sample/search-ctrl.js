(function() {
  'use strict';

  angular.module('app').controller('SearchCtrl', SearchCtrl);

  SearchCtrl.$inject = ['$scope', '$location', 'MLSearchFactory'];

  // inherit from MLSearchController
  var superCtrl = MLSearchController.prototype;
  SearchCtrl.prototype = Object.create(superCtrl);

  function SearchCtrl($scope, $location, searchFactory) {
    var ctrl = this;
    var mlSearch = searchFactory.newContext();

    MLSearchController.call(ctrl, $scope, $location, mlSearch);

    // override a superCtrl method
    ctrl.updateSearchResults = function updateSearchResults(data) {
      superCtrl.updateSearchResults.apply(ctrl, arguments);
      // console.log('updated search results');
    }

    ctrl.init();
  }
})();
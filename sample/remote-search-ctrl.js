(function() {
  'use strict';

  angular.module('app').controller('RemoteSearchCtrl', RemoteSearchCtrl);

  RemoteSearchCtrl.$inject = ['$scope', '$location', 'MLSearchFactory', 'MLRemoteInputService'];

  // inherit from MLRemoteSearchController
  var superCtrl = MLRemoteSearchController.prototype;
  RemoteSearchCtrl.prototype = Object.create(superCtrl);

  function RemoteSearchCtrl($scope, $location, searchFactory, remoteInput) {
    var ctrl = this;
    var mlSearch = searchFactory.newContext();

    MLRemoteSearchController.call(ctrl, $scope, $location, mlSearch, remoteInput);

    // override a superCtrl method
    ctrl.updateSearchResults = function updateSearchResults(data) {
      superCtrl.updateSearchResults.apply(ctrl, arguments);
      // console.log('updated search results');
    }

    ctrl.init();
  }
})();
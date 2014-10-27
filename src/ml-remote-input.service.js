(function () {

  'use strict';

  angular.module('ml.search')
    .service('MLRemoteInputService', MLRemoteInputService);

  MLRemoteInputService.$inject = ['$route'];

  function MLRemoteInputService($route) {
    var service = this;

    service.input = '';
    service.mlSearch = null;
    service.callbacks = [];

    function unsubscribe(idx) {
      service.callbacks.splice(idx);
    }

    service.setInput = function setInput(val) {
      service.input = val;
      _.each(service.callbacks, function(callback) {
        callback(service.input);
      });
    };

    service.subscribe = function subscribe(callback) {
      var idx = service.callbacks.length;
      service.callbacks.push(callback);
      return function() {
        unsubscribe(idx);
      };
    };

    // helper function for mlRemoteInput directive
    service.initInput = function initInput($scope, mlSearch) {
      var unsubscribe = service.subscribe(function(input) {
        $scope.qtext = input;
        mlSearch = service.mlSearch || mlSearch;
      });

      $scope.$on('destroy', unsubscribe);
    };

    // helper function for Search controller
    service.initCtrl = function initCtrl($scope, model, mlSearch, searchCallback) {
      var unsubscribe = service.subscribe(function(input) {
        if (model.qtext !== input) {
          model.qtext = input;

          searchCallback();
        }
      });

      $scope.$on('$destroy', unsubscribe);

      service.mlSearch = mlSearch;

      if ( model.qtext.length && !service.input.length ) {
        service.setInput( model.qtext );
      } else {
        model.qtext = service.input;
      }
    };

    service.getPath = function getPath(searchCtrl) {
      var matches = _.where($route.routes, { controller: searchCtrl }),
          route = { originalPath: '/' };

      if ( matches.length === 0 ) {
        // TODO: get route from attr, or throw Error('can\t find Search controller') ?
        console.error('can\t find Search controller: ' + searchCtrl);
      }
      else {
        route = matches[0];

        if ( matches.length > 1 ) {
          console.log('multiple Search controller routes; choosing \'' +
                      route.originalPath + '\'');
        }
      }

      return route.originalPath;
    };

  }

}());

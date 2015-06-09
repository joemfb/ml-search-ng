/* global describe, beforeEach, module, it, expect, inject */

describe('ml-duration', function () {
  'use strict';

  var elem, $scope, $compile, $rootScope;

  var duration = 'P3Y4M75DT23H31M14.54S';
  var parsedDuration = {
    years: '3',
    months: '4',
    // TODO: research
    weeks: null,
    days: '75',
    hours: '23',
    minutes: '31',
    seconds: '14.54'
  };

  beforeEach(module('ml.search'));

  beforeEach(inject(function ($injector) {
    $rootScope = $injector.get('$rootScope');
    $compile = $injector.get('$compile');

    $scope = $rootScope.$new();
    $scope.duration = duration;

    elem = angular.element(
      '<span ml-duration="duration">' +
        '<span class="years">{{ duration.years }}</span>' +
        '<span class="months">{{ duration.months }}</span>' +
        '<span class="days">{{ duration.days }}</span>' +
        '<span class="hours">{{ duration.hours }}</span>' +
        '<span class="minutes">{{ duration.minutes }}</span>' +
        '<span class="seconds">{{ duration.seconds }}</span>' +
        '<span class="original">{{ duration.toString() }}</span>' +
      '</span>'
    );

    $compile(elem)($scope);
    $scope.$digest();
  }));

  it('should contain template, and handle updates', function() {
    expect( elem.find('.years').text() ).toEqual(parsedDuration.years);
    expect( elem.find('.months').text() ).toEqual(parsedDuration.months);
    expect( elem.find('.days').text() ).toEqual(parsedDuration.days);
    expect( elem.find('.hours').text() ).toEqual(parsedDuration.hours);
    expect( elem.find('.minutes').text() ).toEqual(parsedDuration.minutes);
    expect( elem.find('.seconds').text() ).toEqual(parsedDuration.seconds);
    expect( elem.find('.original').text() ).toEqual(duration);

    var newDuration = 'PT1H1M1S';

    $scope.duration = newDuration;
    $scope.$apply();

    expect( elem.find('.years').text() ).toEqual('');
    expect( elem.find('.months').text() ).toEqual('');
    expect( elem.find('.days').text() ).toEqual('');
    expect( elem.find('.hours').text() ).toEqual('1');
    expect( elem.find('.minutes').text() ).toEqual('1');
    expect( elem.find('.seconds').text() ).toEqual('1');
    expect( elem.find('.original').text() ).toEqual(newDuration);
  });

});

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

  it('should watch initially null variable', function() {
    $scope.duration = null;

    elem = angular.element(
      '<span ml-duration="duration">' +
        '<span class="minutes">{{ duration.minutes }}</span>' +
        '<span class="original">{{ duration.toString() }}</span>' +
      '</span>'
    );
    $compile(elem)($scope);
    $scope.$digest();

    expect( elem.find('.original').text() ).toEqual('');

    $scope.duration = 'PT1M';
    $scope.$apply();

    expect( elem.find('.minutes').text() ).toEqual('1');
    expect( elem.find('.original').text() ).toEqual($scope.duration);
  });
  
  it('should provide a filter', function() {
    $scope.duration = 'P1Y1M1DT1H1M1S';
    
    elem = angular.element(
      '<span>{{ duration | duration }}</span>'
    );
    $compile(elem)($scope);
    $scope.$digest();
    
    expect( elem.text() ).toEqual('1 year, 1 month, 1 day, 1 hour, 1 minute, and 1 second');
    
    $scope.duration = 'P3Y4M75DT23H31M14.54S';
    
    elem = angular.element(
      '<span>{{ duration | duration }}</span>'
    );
    $compile(elem)($scope);
    $scope.$digest();
    
    expect( elem.text() ).toEqual('3 years, 4 months, 75 days, 23 hours, 31 minutes, and 14.54 seconds');

    $scope.options = {
      year: 'year(s)',
      years: 'year(s)',
      month: 'month(s)',
      months: 'month(s)',
      week: 'week(s)',
      weeks: 'week(s)',
      day: 'day(s)',
      days: 'day(s)',
      hour: 'hour(s)',
      hours: 'hour(s)',
      minute: 'minute(s)',
      minutes: 'minute(s)',
      second: 'second(s)',
      seconds: 'second(s)',
    };
    
    elem = angular.element(
      '<span>{{ duration | duration:options }}</span>'
    );
    $compile(elem)($scope);
    $scope.$digest();
    
    expect( elem.text() ).toEqual('3 year(s), 4 month(s), 75 day(s), 23 hour(s), 31 minute(s), and 14.54 second(s)');
    $scope.duration = 'P0Y0M0DT0H0M0S';
    
    elem = angular.element(
      '<span>{{ duration | duration }}</span>'
    );
    $compile(elem)($scope);
    $scope.$digest();
    
    expect( elem.text() ).toEqual('0 seconds');
    
  });

});

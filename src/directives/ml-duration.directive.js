(function() {

  'use strict';

  /**
   * angular attribute directive; parses ISO duration (`xs:duration`) strings.
   *
   * Transcludes markup, and creates a new scope with the following properties:
   *
   * - `years`, `months`, `weeks`, `days`, `hours`, `minutes`, `seconds`
   * - `toString`: a function that returns the original text serialization of the duration
   *
   * see {@link ml-metrics} for an example
   *
   * @namespace ml-duration
   */
  angular.module('ml.search')
    .filter('duration', durationFilter)
    .directive('mlDuration', mlDuration);

  /**
   * angular filter; parses ISO duration (`xs:duration`) strings and creates a string description.
   *
   * Usage: `myduration | duration[:options]`
   *
   * For example, `"P3Y4M75DT23H31M14.54S" | duration` will produce:
   *   "3 years, 4 months, 75 days, 23 hours, 31 minutes, and 14.54 seconds"
   *
   * Duration properties that aren't present will be suppressed. You can provide translations through the options:
   *
   * ```
   * options = {
   *   year: 'year',
   *   years: 'years',
   *   month: 'month',
   *   months: 'months',
   *   week: 'week',
   *   weeks: 'weeks',
   *   day: 'day',
   *   days: 'days',
   *   hour: 'hour',
   *   hours: 'hours',
   *   minute: 'minute',
   *   minutes: 'minutes',
   *   second: 'second',
   *   seconds: 'seconds',
   * }
   * ```
   * @namespace duration
   */
  function durationFilter() {
    return function(duration, options) {
      duration = _.isObject( duration ) ? duration : parseDuration(duration);
      var result = [];
      var _options = {
        year: 'year',
        years: 'years',
        month: 'month',
        months: 'months',
        week: 'week',
        weeks: 'weeks',
        day: 'day',
        days: 'days',
        hour: 'hour',
        hours: 'hours',
        minute: 'minute',
        minutes: 'minutes',
        second: 'second',
        seconds: 'seconds',
      };

      angular.extend(_options, options);

      _.each(['year', 'month', 'week', 'day', 'hour', 'minute', 'second'], function(category) {
        var plural = category + 's';

        if ( duration[ plural ] ) {
          result.push(
            duration[ plural ] + ' ' +
            (duration[ plural ] > 1 ? _options[ plural ] : _options[ category ])
          );
        }
      });

      if (result.length > 1) {

        var last = result.splice(result.length - 1, 1);
        result = result.join(', ') + ', and ' + last[0];
        return result;

      } else {
        return result[0] || '0 seconds';
      }
    };
  }

  function mlDuration() {
    return {
      restrict: 'A',
      transclude: true,
      scope: { mlDuration: '=' },
      link: link
    };
  }

  function link($scope, element, attrs, ctrl, transclude) {
    $scope.$watch('mlDuration', function(newVal, oldVal) {
      if (newVal) {
        angular.extend($scope, {
          duration: parseDuration(newVal)
        });
      }
    });

    transclude($scope, function(clone) {
      element.append(clone);
    });
  }

  function parseDuration(duration) {
    // adapted from https://github.com/dordille/moment-isoduration
    var pattern = [
          'P(',
            '(([0-9]*\\.?[0-9]*)Y)?',
            '(([0-9]*\\.?[0-9]*)M)?',
            '(([0-9]*\\.?[0-9]*)W)?',
            '(([0-9]*\\.?[0-9]*)D)?',
          ')?',
          '(T',
            '(([0-9]*\\.?[0-9]*)H)?',
            '(([0-9]*\\.?[0-9]*)M)?',
            '(([0-9]*\\.?[0-9]*)S)?',
          ')?'
        ],
        regex = new RegExp(pattern.join('')),
        matches = duration.match(regex);

    return {
      years:   parseFloat(matches[3])  || null,
      months:  parseFloat(matches[5])  || null,
      weeks:   parseFloat(matches[7])  || null,
      days:    parseFloat(matches[9])  || null,
      hours:   parseFloat(matches[12]) || null,
      minutes: parseFloat(matches[14]) || null,
      seconds: parseFloat(matches[16]) || null,
      toString: function() {
        return duration;
      }
    };
  }

}());

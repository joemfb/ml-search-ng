/*jshint node: true */

'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    html2Js = require('gulp-ng-html2js'),
    jshint = require('gulp-jshint'),
    karma = require('karma').server,
    minifyHtml = require('gulp-minify-html'),
    path = require('path'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify');

gulp.task('jshint', function() {
  gulp.src([
      './gulpfile.js',
      './src/**/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('scripts', ['test'], function() {
  return gulp.src([
      './src/ml-search.js',
      './src/**/*.js'
    ])
    .pipe(concat('ml-search-ng.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('ml-search-ng.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('templates', ['test'], function() {
  return gulp.src([ './src/**/*.html' ])
    .pipe(minifyHtml({
        empty: true,
        spare: true,
        quotes: true
    }))
    // TODO: ? prefix: '/ml-search'
    .pipe(html2Js({
      moduleName: 'ml.search.tpls',
      prefix: '/'
    }))
    .pipe(concat('ml-search-ng-tpls.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('test', function() {
  karma.start({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
});

gulp.task('autotest', function() {
  karma.start({
    configFile: path.join(__dirname, './karma.conf.js'),
    autoWatch: true
  }, function (exitCode) {
    console.log('Karma has exited with ' + exitCode);
    process.exit(exitCode);
  });
});

gulp.task('default', ['jshint', 'scripts', 'templates']);

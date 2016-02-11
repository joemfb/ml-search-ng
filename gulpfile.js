/* jshint node: true */

'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var replace = require('gulp-replace');
var html2Js = require('gulp-ng-html2js');
var eslint = require('gulp-eslint');
var Server = require('karma').Server;
var minifyHtml = require('gulp-minify-html');
var less = require('gulp-less');
var path = require('path');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var rm = require('gulp-rm');
var ghpages = require('gulp-gh-pages');
var cp = require('child_process');
var coveralls = require('gulp-coveralls');

var version = require('./package.json').version;

// Command line option:
//  --fatal=[warning|error|off]
var fatalLevel = require('yargs').argv.fatal || 'error';

var ERROR_LEVELS = ['error', 'warning'];

function handleError(level, error) {
  gutil.log(error.message);
  if ( ERROR_LEVELS.indexOf(level) <= ERROR_LEVELS.indexOf(fatalLevel) ) {
    process.exit(1);
  }
}

gulp.task('lint', function() {
  return gulp.src([
      './gulpfile.js',
      './src/**/*.js'
    ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('error', function(err) {
      handleError('warning', err);
      this.emit('end');
    });
});

gulp.task('scripts', function() {
  return gulp.src([
      './src/ml-search.js',
      './src/**/*.js'
    ])
    .pipe(replace('@version', version))
    .pipe(concat('ml-search-ng.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('ml-search-ng.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

gulp.task('styles', function() {
  return gulp.src('./src/styles/*.less')
    .pipe(concat('ml-search-ng-tpls.less'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('ml-search-ng-tpls.css'))
    .pipe(less())
    .pipe(gulp.dest('dist'));
});

gulp.task('templates', function() {
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
    .pipe(concat('ml-search-ng-tpls.js'))
    .pipe(gulp.dest('dist'))
    .pipe(rename('ml-search-ng-tpls.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist'));
});

function karmaResult(cb, result) {
  var err = null;
  if (result === 1) {
    err = new Error('test failed');
  }
  cb(err);
}

gulp.task('test', ['templates', 'lint'], function(done) {
  new Server({
    configFile: path.join(__dirname, './karma.conf.js'),
    singleRun: true,
    autoWatch: false
  }, karmaResult.bind(null, done))
  .start();
});

gulp.task('autotest', function(done) {
  new Server({
    configFile: path.join(__dirname, './karma.conf.js'),
    autoWatch: true
  }, karmaResult.bind(null, done))
  .start();
});

gulp.task('docs', function(done) {
  cp.exec('./node_modules/.bin/jsdoc -c jsdoc.conf.json', function(err) {
    if (err) {
      return console.log(err);
    }

    gulp.src([
        './docs/generated/css/baseline.css',
        './docs/custom-styles.css'
      ])
      .pipe(concat('baseline.css'))
      .pipe(gulp.dest('./docs/generated/css'))
      .on('end', function() {
        done();
      });
  });
});

gulp.task('clean-docs', function() {
  return gulp.src('./docs/generated/**/*', { read: false })
  .pipe(rm({async: false}));
});

gulp.task('publish-docs', function() {
  return gulp.src([ './docs/generated/**/*.*' ])
  .pipe(ghpages());
});

gulp.task('coveralls', function() {
  return gulp.src('coverage/**/lcov.info')
  .pipe(coveralls());
});

gulp.task('default', ['lint', 'test', 'scripts', 'templates', 'styles']);

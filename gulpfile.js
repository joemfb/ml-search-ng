/* jshint node: true */

'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    concat = require('gulp-concat'),
    html2Js = require('gulp-ng-html2js'),
    eslint = require('gulp-eslint'),
    Server = require('karma').Server,
    minifyHtml = require('gulp-minify-html'),
    less = require('gulp-less'),
    path = require('path'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    rm = require('gulp-rm'),
    ghpages = require('gulp-gh-pages'),
    cp = require('child_process'),
    coveralls = require('gulp-coveralls');

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

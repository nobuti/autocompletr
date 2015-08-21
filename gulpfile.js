var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var minifyCSS = require('gulp-minify-css');
var sass = require('gulp-sass');
var size = require('gulp-size');

var paths = {
  src: 'assets',
  dist: 'build'
};

gulp.task('browser-sync', function() {
  browserSync({
    notify: false,
    logPrefix: 'server',
    port: 8080,
    server: {
      baseDir: paths.build
    }
  });
});

gulp.task('compress:js', function() {
  return gulp.src(paths.src + '/**/*.js')
    // Add a non-minified copy to the dist folder before compression
    .pipe(gulp.dest(paths.dist))
    .pipe(uglify({
      preserveComments: 'some'
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.dist))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('compress:css', function() {
  return gulp.src(paths.src + '/**/*.css')
    // Add a non-minified copy to the dist folder before compression
    .pipe(gulp.dest(paths.dist))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.dist))
});

gulp.task('size:css', function() {
  return gulp.src(paths.dist + '/autocompletr.css')
    .pipe(minifyCSS())
    .pipe(size({
      gzip: true
    }))
    .pipe(rename("autocompletr.min.css"))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('size:js', function() {
  return gulp.src(paths.dist + '/autocompletr.js')
    .pipe(uglify())
    .pipe(size({
      gzip: true
    }))
    .pipe(rename("autocompletr.min.js"))
    .pipe(gulp.dest(paths.dist));
});

gulp.task('sass', function() {
  return gulp.src(paths.src + '/**/*.scss')
    .pipe(sass())
    .pipe(autoprefixer({
      browsers: ['> 0.5%', 'last 2 versions', 'ie 9', 'Firefox 22'],
      cascade: false
    }))
    .pipe(gulp.dest(paths.dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('compress:css', function() {
  return gulp.src(paths.src + '/**/*.css')
    // Add a non-minified copy to the dist folder before compression
    .pipe(gulp.dest(paths.dist))
    .pipe(minifyCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.dist))
});

gulp.task('watch', function() {
  gulp.watch(paths.src + '/**/*.js', ['compress:js']);
  gulp.watch(paths.src + '/**/*.scss', ['sass', 'compress:css']);
});

gulp.task('build', ['sass', 'compress:js', 'compress:css']);
gulp.task('default', ['build', 'browser-sync', 'watch']);
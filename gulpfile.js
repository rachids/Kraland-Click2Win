var gulp = require('gulp')
, minifyHtml = require("gulp-minify-html")
, minifyCss = require("gulp-minify-css")
, uglify = require("gulp-uglify")
, concat = require("gulp-concat");
 
gulp.task('minify-css', function () {
    gulp.src('./css/*.css') // path to your file
    .pipe(concat('kraland.css')) // concat files
    .pipe(minifyCss())
    .pipe(gulp.dest('./final/css'));
});
 
gulp.task('minify-html', function () {
    gulp.src('./index.php') // path to your files
    .pipe(minifyHtml())
    .pipe(gulp.dest('./final'));
});

// task
gulp.task('ca-va-brasser', function () {
    gulp.src('./js/jeu/*.js') // path to your files
    .pipe(concat('click2win.js')) // concat files
    .pipe(uglify()) // minify files
    .pipe(gulp.dest('./final/js'));
});
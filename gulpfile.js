'use strict';

/*plugins:[
    new webpack.ProvidePlugin({
        jQuery: 'jquery',
        $: 'jquery',
        jquery: 'jquery'
    })
]*/

// modules
var jQuery = require('jquery');
var $ = require('jquery');
var jquery = require('jquery');

var browserify = require('browserify');
var browserSync = require('browser-sync');
//var bootstrapLess = require('bootstrap-less');
var collate = require('./tasks/collate');
var compile = require('./tasks/compile');
var concat = require('gulp-concat');
var csso = require('gulp-csso');
var del = require('del');
var gulp = require('gulp');
var clip = require('gulp-clip-empty-files');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
//var jquery = require('jquery');
var plumber = require('gulp-plumber');
//var prefix = require('gulp-autoprefixer');
var Q = require('q');
var rename = require('gulp-rename');
var reload = browserSync.reload;
var runSequence = require('run-sequence');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
//var less = require('gulp-less-sourcemap');
var source = require('vinyl-source-stream');
var streamify = require('gulp-streamify');
var uglify = require('gulp-uglify');


var cssmin = require('gulp-cssmin');

// Configuration Control
var srcFabricator = './src/fabricator';
var srcToolkit = './src/toolkit';
var srcBootstrap = './src/bootstrap';

var config = {
	dev: gutil.env.dev,
	src: {
		scripts: {
			fabricator: [
				srcFabricator + '/scripts/prism.js',
				srcFabricator + '/scripts/classlist-shim.js',
				srcFabricator + '/scripts/fabricator.js'
			],
			toolkit: [
				srcToolkit + '/assets/scripts/toolkit.js',
				'node_modules/jquery/dist/jquery.min.js',
				'node_modules/bootstrap-less/js/bootstrap.min.js'
			]
		},
		styles: {
			fabricator: srcFabricator + '/styles/fabricator.less',
			toolkit: srcToolkit + '/assets/styles/toolkit.less',
			bootstrap: srcBootstrap + '/styles/toolkit.less'
		},
		images: srcToolkit + '/assets/images/**/*',
		views: srcToolkit + '/views/*.html',
		materials: [
			'components',
			'structures',
			'templates',
			'documentation',
            'bootstrap',
            'whitespace'
		]
	},
	dest: './build'
};

// clean
gulp.task('clean', function (cb) {
	del([config.dest], cb);
});

// styles
gulp.task('styles:fabricator', function () {
	return gulp.src(config.src.styles.fabricator)
		.pipe(plumber())
		//.pipe(clip())		
		.pipe(less({
			errLogToConsole: true
		}))
		//.pipe(prefix('last 2 version'))
		.pipe(gulpif(!config.dev, csso()))
		.pipe(rename('f.css'))
		.pipe(gulp.dest(config.dest + '/fabricator/styles'))
		.pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles:toolkit', function () {
	return gulp.src(config.src.styles.toolkit)
		//.pipe(plumber())
		//.pipe(clip())		
		//.pipe(sourcemaps.init())    		
        .pipe(sourcemaps.init({loadMaps: true}))
		.pipe(less({
			errLogToConsole: true/*,
			sourceMap: {
			    sourceMapRootpath: 'node_modules/bootstrap-less/bootstrap/' // Optional absolute or relative path to your LESS files 
			}*/
		}))
        .pipe(sourcemaps.write('./'))
		//.pipe(sourcemaps.write())
		//.pipe(prefix('last 2 version'))
		.pipe(gulpif(!config.dev, csso()))
		.pipe(gulp.dest(config.dest + '/toolkit/styles'))

        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(config.dest + '/toolkit/styles'))

		.pipe(gulpif(config.dev, reload({stream:true})));
});

gulp.task('styles', ['styles:fabricator', 'styles:toolkit']);


// scripts
gulp.task('scripts:fabricator', function () {
	return gulp.src(config.src.scripts.fabricator)
		.pipe(plumber())
		.pipe(concat('f.js'))
		.pipe(gulpif(!config.dev, uglify()))
		.pipe(gulp.dest(config.dest + '/fabricator/scripts'));
});

gulp.task('scripts:toolkit', function () {
	/*return browserify(config.src.scripts.toolkit).bundle()
		.pipe(plumber())
		//.pipe(source('toolkit.js'))
		.pipe(concat('toolkit.js'))		
		.pipe(gulpif(!config.dev, streamify(uglify())))
		.pipe(gulp.dest(config.dest + '/toolkit/scripts'));*/

	return gulp.src(config.src.scripts.toolkit)
		.pipe(plumber())
		.pipe(concat('toolkit.js'))
		.pipe(gulpif(!config.dev, uglify()))
		.pipe(gulp.dest(config.dest + '/toolkit/scripts'));

});

gulp.task('scripts', ['scripts:fabricator', 'scripts:toolkit']);


// images
gulp.task('images', ['favicon'], function () {
	return gulp.src(config.src.images)
		.pipe(imagemin())
		.pipe(gulp.dest(config.dest + '/toolkit/images'));
});

gulp.task('favicon', function () {
	return gulp.src('./src/favicon.ico')
		.pipe(gulp.dest(config.dest));
});


// collate
gulp.task('collate', function () {

	// 'collate' is a little different -
	// it returns a promise instead of a stream

	var deferred = Q.defer();

	var opts = {
		materials: config.src.materials,
		dest: config.dest + '/fabricator/data/data.json'
	};

	// run the collate task; resolve deferred when complete
	collate(opts, deferred.resolve);

	return deferred.promise;

});

// assembly
gulp.task('assemble:fabricator', function () {
	var opts = {
		data: config.dest + '/fabricator/data/data.json',
		template: false
	};

	return gulp.src(config.src.views)
		.pipe(compile(opts))
		.pipe(gulp.dest(config.dest));
});

gulp.task('assemble:templates', function () {
	var opts = {
		data: config.dest + '/fabricator/data/data.json',
		template: true
	};
	return gulp.src('./src/toolkit/templates/*.html')
		.pipe(compile(opts))
		.pipe(rename({
			prefix: 'template-'
		}))
		.pipe(gulp.dest(config.dest));
});

gulp.task('assemble', ['collate'], function () {
	gulp.start('assemble:fabricator', 'assemble:templates');
});


// server
gulp.task('browser-sync', function () {
	browserSync({
		server: {
			baseDir: config.dest
		},
		notify: false
	});
});


// watch
gulp.task('watch', ['browser-sync'], function () {
	gulp.watch('src/toolkit/{components,structures,templates,documentation,views,bootstrap}/**/*.{html,md}', ['assemble', browserSync.reload]);
	gulp.watch('src/fabricator/styles/**/*.less', ['styles:fabricator']);
	gulp.watch('src/toolkit/assets/styles/**/*.less', ['styles:toolkit']);
	gulp.watch('src/bootstrap/styles/*.less', ['styles:bootstrap']);

    //gulp.watch('node_modules/bootstrap-less/bootstrap/*.less', ['styles:toolkit']);
    //gulp.watch('node_modules/bootstrap-less/bootstrap/**/*.less', ['styles:toolkit']);

    gulp.watch('bootstrap-less/bootstrap/*.less', ['styles:toolkit']);
    gulp.watch('bootstrap-less/bootstrap/**/*.less', ['styles:toolkit']);


    gulp.watch('src/fabricator/scripts/**/*.js', ['scripts:fabricator', browserSync.reload]);
	gulp.watch('src/toolkit/assets/scripts/**/*.js', ['scripts:toolkit', browserSync.reload]);
	gulp.watch(config.src.images, ['images', browserSync.reload]);
});


// default build task
gulp.task('default', ['clean'], function () {

	// define build tasks
	var tasks = [
		'styles',
		'scripts',
		'images',
		'assemble'
	];

	// run build
	runSequence(tasks, function () {
		if (config.dev) {
			gulp.start('watch');
		}
	});

});

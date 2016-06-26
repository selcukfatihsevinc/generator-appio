var AppIo = require('app.io');
new AppIo({basedir: __dirname}).run();

/*
var AppIo = require('app.io');
new AppIo({
	basedir: __dirname,
	verbose: true,
	boot: 'mailer|forward',
	resize: true,
	core: ['mongo', 'redis', 'cache'],
	external: {
		boot: 'i18n|gitversion',
		model: [],
		middle: [],
		lib: [],
		route: []
	}
}).run();
*/

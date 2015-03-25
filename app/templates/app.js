var AppIo = require('app.io');

var app = new AppIo({
    basedir: __dirname
});

process.env.TZ = 'UTC';

var _env = app.get('env');

app.external('config/'+_env);
app.load('system/logger');
app.load('core', ['mongo', 'redis']);
// app.load('core', ['solr', 'cache']); // other core options
app.load('lib');
// load external libs here
app.load('model');
// load external models here
app.load('middle');
app.load('boot', [
    'view',
    'compress',
    'static',
    'body',
    'cookie',
    'session',
    'flash',
    'favicon',
    'locals',
    'config',
    'admin/redirect',
    'cron',
    'env',
    'x-powered-by',
    'kue',
    'kue-ui'
]);
// external boot files
// external worker files
app.load('system/response/app'); // before routes
app.load('route');
// load external routes
app.load('system/handler/app'); // after routes
app.load('worker');
app.load('sync/data');
app.listen();






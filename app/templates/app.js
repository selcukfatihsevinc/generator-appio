// newrelic
if(process.env.NODE_RELIC) {
  console.log('init newrelic');
  require('newrelic');
}

var AppIo = require('app.io');
var app   = new AppIo({basedir: __dirname});

// process
process.env.TZ = 'UTC';

app.external('config/'+app.get('env'));
app.load('system/logger');
app.load('core', ['mongo', 'redis']);
// app.load('core', ['solr', 'elasticsearch', 'cache', 'db']); // other core options
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
    'x-powered-by'
    // 'kue',
    // 'kue-ui',
    // 'mailer',
    // 'oauthproxy',
    // 'cors',
    // 'override',
    // 'socketauth',
    // 'env'
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






var i18n = require('i18n');

module.exports = function(app) {

    var _log = app.system.logger;

    try {

        i18n.configure({
            locales:['en'],
            directory: __dirname+'/locales',
            defaultLocale: 'en',
            cookie: 'lang',
            objectNotation: true
        });

        app.use(i18n.init);

        return true;
    }
    catch(e) {
        _log.error(e.stack);
        return false;
    }

};





var git = require('git-rev-sync');

module.exports = function(app) {

    var _log = app.system.logger;

    try {

        app.use(function(req, res, next) {
            res.locals.gitversion = git.long();
            next();
        });

        return true;
    }
    catch(e) {
        _log.error(e.stack);
        return false;
    }

};





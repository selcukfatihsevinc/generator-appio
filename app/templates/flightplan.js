var plan   = require('flightplan');
var fs     = require('fs');
var swig   = require('swig');
var _      = require('underscore');
var mkdirp = require('mkdirp');

try {
    var app  = process.env.APP;
    var conf = require('./fly/'+app+'.json');

    _.each(conf.targets, function(value, key) {
        if(value.host)
            value.agent = process.env.SSH_AUTH_SOCK;

        plan.target(key, value);
    });

    var basedir = 'opt'; // base directory: /opt
    var appdir  = 'deploy'; // base app deploy directory: /opt/deploy
    var dbdir   = 'database'; // base database directory: /opt/database
    var repodir = conf.repo.name; // repo directory: /opt/deploy/myapp
    var fulldir = '/'+basedir+'/'+appdir+'/'+repodir+'/';
}
catch(e) {
    console.log(e);
}

// test
plan.remote('test', function(remote) {
    remote.cd('/home');
});

// gerekli apt paketlerini kur
plan.remote('apt#setup', function(remote) {
    // -y : onay beklemeden kurması için
    remote.sudo('apt-get update');
    remote.sudo('apt-get -y install build-essential');
    remote.sudo('apt-get -y install git');
});

// node.js setup
plan.remote('nvm#setup', function(remote) {
    remote.exec('curl https://raw.githubusercontent.com/creationix/nvm/v0.19.0/install.sh | bash');

    remote.with('source ~/.nvm/nvm.sh', function() {
        remote.exec('nvm install '+conf.node);
        remote.log('node.js installed version:');
        remote.exec('~/.nvm/v'+conf.node+'/bin/node -v');
    });
});

// application setup
plan.remote('app#setup', function(remote) {
    remote.with('cd /'+basedir, function() {
        remote.sudo('mkdir -p '+appdir);
        remote.sudo('chmod -R 777 '+appdir);

        remote.with('cd '+appdir, function() {
            remote.git('clone '+conf.repo.url);

            remote.with('cd '+repodir, function() {
                remote.exec('~/.nvm/v'+conf.node+'/bin/npm install');
            });
        });
    });
});

plan.remote('app#deploy', function(remote) {
    remote.with('cd '+fulldir, function() {
        remote.git('pull origin master');
        remote.exec('~/.nvm/v'+conf.node+'/bin/npm install'); // install new npm packages
    });
});

/**
 * @TODO
 * redis config'i template olarak durabilir, password vs eklenip upload edilir
 */

// redis setup
plan.remote('redis#setup', function(remote) {
    remote.with('cd /'+basedir, function() {
        remote.sudo('mkdir -p '+dbdir);
        remote.sudo('chmod -R 777 '+dbdir);

        remote.with('cd '+dbdir, function() {
            remote.exec('wget http://download.redis.io/releases/redis-'+conf.redis+'.tar.gz');
            remote.exec('tar xzf redis-'+conf.redis+'.tar.gz');

            remote.with('cd redis-'+conf.redis, function() {
                remote.exec('make');
                remote.sudo('make install');
            });
        });
    });
});

// redis upstart setup
plan.local('upstart#redis', function(local) {
    try {
        var tpl    = swig.compileFile('./upstart/template/redis-template.conf');
        var target = plan.runtime.target;

        var str = tpl({
            name    : 'redis',
            version : conf.redis
        });

        var writeDir = __dirname+'/upstart/generated/'+conf.upstart.name+'/'+target;

        mkdirp(writeDir, function (err) {
            if (err)
                return local.log(err);

            fs.writeFile(writeDir+'/redis.conf', str, function(err) {
                local.log(err || 'redis upstart config generated');
            });
        });
    }
    catch(e) {
        local.log(e);
    }
});

// mongodb setup
plan.remote('mongodb#setup', function(remote) {
    remote.sudo('apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10');
    remote.exec("echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list");
    remote.sudo('apt-get update');
    remote.sudo('apt-get install -y mongodb-org');
});

// mongodb3 setup
plan.remote('mongodb3#setup', function(remote) {
  remote.sudo('apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10');
  remote.exec("echo 'deb http://repo.mongodb.org/apt/ubuntu '$(lsb_release -sc)'/mongodb-org/3.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list");
  remote.sudo('apt-get update');
  remote.sudo('apt-get install -y mongodb-org');
});

// mongodb setup
plan.remote('mongodb#start', function(remote) {
    remote.sudo('service mongod start');
});

plan.remote('mongodb#stop', function(remote) {
    remote.sudo('service mongod stop');
});

plan.remote('mongodb#restart', function(remote) {
    remote.sudo('service mongod restart');
});

// upstart setup
plan.local('upstart#app', function(local) {
    try {
        var upstart  = conf.upstart;
        var tpl      = swig.compileFile('./upstart/template/app-template.conf');
        var target   = plan.runtime.target;
        var writeDir = __dirname+'/upstart/generated/'+upstart.name+'/'+target;

        mkdirp(writeDir, function (err) {
            if (err)
                return local.log(err);

            _.each(upstart.instances, function(value, key) {
                var name = upstart.name+'-'+key;
                var str  = tpl({
                    name     : name,
                    nodeenv  : plan.runtime.target,
                    nodeapp  : value.env.NODE_APP,
                    nodeport : value.env.NODE_PORT,
                    nodedir  : value.nodedir,
                    fulldir  : fulldir,
                    node     : conf.node,
                    exec     : value.exec
                });

                fs.writeFile(writeDir+'/'+name+'.conf', str, function(err) {
                    local.log(err || 'upstart config generated');
                });
            });
        });
    }
    catch(e) {
        local.log(e);
    }
});

plan.local('upstart#load', function(local) {
    local.log('copy upstart files to remote host /tmp/upstart folder');
    var target = plan.runtime.target;

    local.with('cd upstart/generated/'+app+'/'+target, function() {
        var files = local.ls();
        // rsync files to all the target's remote hosts
        local.transfer(files, '/tmp/upstart');
    });
});

plan.remote('upstart#load', function(remote) {
    remote.log('copy upstart files to remote host /etc/init folder');

    remote.with('cd /tmp/upstart', function() {
        remote.sudo('cp * /etc/init');
    });
});

// service actions
plan.remote('start', function(remote) {
    var input = remote.prompt('write service name:');

    if( ! input )
        return plan.abort('fly cancelled');

    remote.sudo('start '+input);
});

plan.remote('stop', function(remote) {
    var input = remote.prompt('write service name:');

    if( ! input )
        return plan.abort('fly cancelled');

    remote.sudo('stop '+input);
});

plan.remote('restart', function(remote) {
    var input = remote.prompt('write service name:');

    if( ! input )
        return plan.abort('fly cancelled');

    remote.sudo('restart '+input);
});

// new relic setup
plan.remote('newrelic#setup', function(remote) {
  var target = plan.runtime.target;

  remote.exec('echo deb http://apt.newrelic.com/debian/ newrelic non-free >> /etc/apt/sources.list.d/newrelic.list');
  remote.exec('wget -O- https://download.newrelic.com/548C16BF.gpg | apt-key add -');
  remote.sudo('apt-get update');
  remote.sudo('apt-get install -y newrelic-sysmond');
  remote.exec('nrsysmond-config --set license_key='+conf.targets[target].newrelic);
});

plan.remote('newrelic#start', function(remote) {
  remote.sudo('/etc/init.d/newrelic-sysmond start');
});

plan.remote('newrelic#stop', function(remote) {
  remote.sudo('/etc/init.d/newrelic-sysmond stop');
});

plan.remote('newrelic#restart', function(remote) {
  remote.sudo('/etc/init.d/newrelic-sysmond restart');
});













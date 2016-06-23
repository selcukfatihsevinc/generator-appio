var plan   = require('flightplan');
var fs     = require('fs');
var swig   = require('swig');
var _      = require('underscore');
var mkdirp = require('mkdirp');

/**
 * ----------------------------------------------------------------
 * Init
 * ----------------------------------------------------------------
 */

try {
  var app  = process.env.APP || '<%= appSlug %>';
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

  // node nvm directory
  var nvmInstall = '';
  if(conf.node.substr(0, 4) == '0.12')
    nvmInstall = 'versions/node/';

}
catch(e) {
  console.log(e);
}

/**
 * ----------------------------------------------------------------
 * Remote Test
 * ----------------------------------------------------------------
 */

plan.remote('test', function(remote) {
  remote.cd('/home');
});

/**
 * ----------------------------------------------------------------
 * Apt Setup
 * ----------------------------------------------------------------
 */

plan.remote('apt#setup', function(remote) {
  // -y : onay beklemeden kurması için
  remote.sudo('apt-get update');
  remote.sudo('apt-get -y install build-essential');
  remote.sudo('apt-get -y install git');
});

/**
 * ----------------------------------------------------------------
 * Node.js Setup
 * ----------------------------------------------------------------
 */

plan.remote('nvm#setup', function(remote) {
  remote.exec('curl https://raw.githubusercontent.com/creationix/nvm/v0.25.4/install.sh | bash');

  remote.with('source ~/.nvm/nvm.sh', function() {
    remote.exec('nvm install '+conf.node);
    remote.log('node.js installed version:');
    remote.exec('~/.nvm/'+nvmInstall+'v'+conf.node+'/bin/node -v');
    remote.exec('sudo ln -s ~/.nvm/'+nvmInstall+'v'+conf.node+'/bin/node /usr/bin/node');
  });
});

/**
 * ----------------------------------------------------------------
 * Application Setup
 * ----------------------------------------------------------------
 */

plan.remote('app#setup', function(remote) {
  remote.with('cd /'+basedir, function() {
    remote.sudo('mkdir -p '+appdir);
    remote.sudo('chmod -R 777 '+appdir);

    remote.with('cd '+appdir, function() {
      remote.git('clone '+conf.repo.url);

      remote.with('cd '+repodir, function() {
        remote.exec('~/.nvm/'+nvmInstall+'/v'+conf.node+'/bin/npm install');
      });
    });
  });
});

plan.remote('app#deploy', function(remote) {
  remote.with('cd '+fulldir, function() {
    remote.git('pull origin master');
    remote.exec('~/.nvm/'+nvmInstall+'/v'+conf.node+'/bin/npm install'); // install new npm packages
  });
});

plan.remote('app#resizer', function(remote) {
  remote.with('cd '+fulldir+'node_modules/app.io/', function() {
    remote.exec('~/.nvm/'+nvmInstall+'v'+conf.node+'/bin/npm install image-resizer');
  });
});

/**
 * ----------------------------------------------------------------
 * Redis Setup
 * ----------------------------------------------------------------
 */

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

/**
 * ----------------------------------------------------------------
 * Redis Upstart Setup
 * ----------------------------------------------------------------
 */

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

/**
 * ----------------------------------------------------------------
 * Mongodb Setup
 * ----------------------------------------------------------------
 */

plan.remote('mongodb#setup', function(remote) {
  remote.sudo('apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10');
  remote.exec("echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list");
  remote.sudo('apt-get update');
  remote.sudo('apt-get install -y mongodb-org');
});

/**
 * ----------------------------------------------------------------
 * Mongodb 3 Setup
 * ----------------------------------------------------------------
 */

plan.remote('mongodb3#setup', function(remote) {
  remote.sudo('apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10');
  remote.exec("echo 'deb http://repo.mongodb.org/apt/ubuntu '$(lsb_release -sc)'/mongodb-org/3.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list");
  remote.sudo('apt-get update');
  remote.sudo('apt-get install -y mongodb-org');
});

/**
 * ----------------------------------------------------------------
 * Mongodb Services
 * ----------------------------------------------------------------
 */

plan.remote('mongodb#start', function(remote) {
  remote.sudo('service mongod start');
});

plan.remote('mongodb#stop', function(remote) {
  remote.sudo('service mongod stop');
});

plan.remote('mongodb#restart', function(remote) {
  remote.sudo('service mongod restart');
});

/**
 * ----------------------------------------------------------------
 * Upstart App Setup
 * ----------------------------------------------------------------
 */

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
          name       : name,
          nodeenv    : plan.runtime.target,
          nodeapp    : value.env.NODE_APP,
          nodeport   : value.env.NODE_PORT,
          nodedir    : value.nodedir,
          fulldir    : fulldir,
          node       : conf.node,
          exec       : value.exec,
          nvmInstall : nvmInstall
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

/**
 * ----------------------------------------------------------------
 * Upstart Worker Setup
 * ----------------------------------------------------------------
 */

plan.local('upstart#worker', function(local) {
  try {
    var upstart  = conf.upstart;
    var tpl      = swig.compileFile('./upstart/template/worker-template.conf');
    var target   = plan.runtime.target;
    var writeDir = __dirname+'/upstart/generated/'+upstart.name+'/'+target;

    mkdirp(writeDir, function (err) {
      if (err)
        return local.log(err);

      _.each(upstart.instances, function(value, key) {
        var name = upstart.name+'-worker';
        var str  = tpl({
          name       : name,
          nodeenv    : plan.runtime.target,
          nodeapp    : value.env.NODE_APP,
          nodedir    : value.nodedir,
          fulldir    : fulldir,
          node       : conf.node,
          worker     : value.worker,
          nvmInstall : nvmInstall
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

/**
 * ----------------------------------------------------------------
 * Upstart Load
 * ----------------------------------------------------------------
 */

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

  remote.sudo('mkdir -p /tmp/upstart');
  remote.with('cd /tmp/upstart', function() {
    remote.sudo('cp * /etc/init');
  });
});

/**
 * ----------------------------------------------------------------
 * Service Actions (start, stop, restart)
 * ----------------------------------------------------------------
 */

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

/**
 * ----------------------------------------------------------------
 * New Relic Setup
 * ----------------------------------------------------------------
 */

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

/**
 * ----------------------------------------------------------------
 * Java Setup
 * ----------------------------------------------------------------
 */

plan.remote('java#setup', function(remote) {
  // -y : onay beklemeden kurması için
  remote.sudo('apt-get update');
  remote.sudo('apt-get -y install openjdk-7-jre-headless');
});

/**
 * ----------------------------------------------------------------
 * Elasticsearch Setup
 * ----------------------------------------------------------------
 */

plan.remote('elastic#setup', function(remote) {
  var target = plan.runtime.target;

  remote.with('cd /'+basedir, function() {
    remote.sudo('mkdir -p '+dbdir);
    remote.sudo('chmod -R 777 '+dbdir);

    remote.with('cd '+dbdir, function() {
      remote.exec('wget https://download.elastic.co/elasticsearch/elasticsearch/elasticsearch-'+conf.elastic+'.tar.gz');
      remote.exec('tar xzf elasticsearch-'+conf.elastic+'.tar.gz');
    });
  });
});

/**
 * ----------------------------------------------------------------
 * Elasticsearch http-basic Setup
 * ----------------------------------------------------------------
 */

plan.remote('elastichttp#setup', function(remote) {
  var target = plan.runtime.target;

  remote.with('cd /'+basedir+'/'+dbdir+'/elasticsearch-'+conf.elastic+'/plugins', function() {
    remote.sudo('mkdir http-basic');

    remote.with('cd http-basic', function() {
      remote.exec('wget https://github.com/Asquera/elasticsearch-http-basic/releases/download/v1.5.0/elasticsearch-http-basic-1.5.0.jar');
    })
  });
});

/**
 * ----------------------------------------------------------------
 * Elasticsearch Upstart Setup
 * ----------------------------------------------------------------
 */

plan.local('upstart#elastic', function(local) {
  try {
    var tpl    = swig.compileFile('./upstart/template/elastic-template.conf');
    var target = plan.runtime.target;

    var str = tpl({
      name    : 'elastic',
      fulldir : '/'+basedir+'/'+dbdir+'/elasticsearch-'+conf.elastic+'/bin'
    });

    var writeDir = __dirname+'/upstart/generated/'+conf.upstart.name+'/'+target;

    mkdirp(writeDir, function (err) {
      if (err)
        return local.log(err);

      fs.writeFile(writeDir+'/elastic.conf', str, function(err) {
        local.log(err || 'elasticsearch upstart config generated');
      });
    });
  }
  catch(e) {
    local.log(e);
  }
});












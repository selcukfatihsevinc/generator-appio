var yeoman = require('yeoman-generator');
var chalk  = require('chalk');
var yosay  = require('yosay');
var keygen = require('keygenerator');

module.exports = yeoman.generators.Base.extend({

  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('AppIo') + ' generator!'
    ));

    var prompts = [
      {
        type    : 'input',
        name    : 'appName',
        message : 'Write app name (example: My App)',
        default : 'My App'
      },
      {
        type    : 'input',
        name    : 'appSlug',
        message : 'Write app slug (example: myapp)',
        default : 'myapp'
      },
      {
        type    : 'input',
        name    : 'appDesc',
        message : 'Write app description (example: My App Description)',
        default : 'My App Description'
      }
    ];

    this.prompt(prompts, function (props) {
      this.appName = props.appName;
      this.appSlug = props.appSlug;
      this.appDesc = props.appDesc;

      done();
    }.bind(this));
  },

  writing: {
    dev: function() {
      this.fs.copyTpl(
        this.templatePath('config/development'),
        this.destinationPath('config/development'),
        {
          appName: this.appName,
          appSlug: this.appSlug,
          appDesc: this.appDesc,
          sessionSecret: keygen._(),
          tokenSecret: keygen._()
        }
      );
    },

    prod: function() {
      this.fs.copyTpl(
        this.templatePath('config/production'),
        this.destinationPath('config/production'),
        {
          appName: this.appName,
          appSlug: this.appSlug,
          appDesc: this.appDesc,
          sessionSecret: keygen._(),
          tokenSecret: keygen._(),
          basicSecret: keygen._(),
          adminPass: keygen._(),
          mongoPass: keygen._(),
          redisPass: keygen._()
        }
      );
    },

    app: function () {
      this.fs.copyTpl( this.templatePath('boot'), this.destinationPath('boot') );

      this.mkdir('config/staging');
      this.mkdir('config/testing');

      this.fs.copyTpl(
        this.templatePath('fly/doc.txt'),
        this.destinationPath('fly/doc.txt'),
        {appSlug: this.appSlug}
      );

      this.fs.copyTpl(
        this.templatePath('fly/fly.json'),
        this.destinationPath('fly/'+this.appSlug+'.json'),
        {
          appName: this.appName,
          appSlug: this.appSlug,
          appDesc: this.appDesc
        }
      );

      this.mkdir('model');
      this.fs.copy( this.templatePath('public'), this.destinationPath('public') );
      this.mkdir('route');
      this.mkdir('upstart/generated/'+this.appSlug);
      this.fs.copy( this.templatePath('upstart/template'), this.destinationPath('upstart/template') );
      this.mkdir('view');
      this.mkdir('worker');
      this.fs.copy( this.templatePath('app.js'), this.destinationPath('app.js') );
      this.fs.copy( this.templatePath('flightplan.js'), this.destinationPath('flightplan.js') );
      this.fs.copy( this.templatePath('gitignore'), this.destinationPath('.gitignore') );

      this.fs.copyTpl(
        this.templatePath('package.json'),
        this.destinationPath('package.json'),
        {
          appSlug: this.appSlug,
          appDesc: this.appDesc
        }
      );
    }
  },

  install: function () {

    this.installDependencies({
      skipInstall: this.options['skip-install']
    });

  }

});

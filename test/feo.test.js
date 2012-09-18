var assert = require("assert"),
    libpath = process.env['YOUR_LIBRARY_NAME_COV'] ? '../lib-cov' : '../lib',
    feo = require(libpath + '/feo.js'),
    jsdom = require("jsdom"),
    fs = require("fs"),
    path = require("path");


describe('feo', function(){
  describe('#init()', function(){
    it('should be cleaning dist', function(done){
      feo.init({dist:'dist',log:false});
      assert.equal(0, fs.readdirSync( 'dist' ).length);
      done();
    });
  });

  describe('#resolve()', function(){
    it('should be resolve path', function(done){
      assert.equal(
        'examples/js/1.js',
        feo.resolve(
          'examples',
          'examples/path/to/html/index.html', 
          '/js/1.js'
        )
      );

      assert.equal(
        path.resolve()+'/examples/js/1.js',
        feo.resolve(
          'examples',
          'examples/path/to/html/index.html', 
          '../../../js/1.js'
        )
      );

      assert.equal(
        'http://sideroad.secret.jp/js/jquery.sidebar.js',
        feo.resolve(
          'examples',
          'examples/path/to/html/index.html', 
          'http://sideroad.secret.jp/js/jquery.sidebar.js'
        )
      );

      assert.equal(
        'http://sideroad.secret.jp/js/jquery.sidebar.js',
        feo.resolve(
          '',
          'http://sideroad.secret.jp/plugins/jQuerySideBar/',
          '/js/jquery.sidebar.js'
        )
      );

      assert.equal(
        'http://sideroad.secret.jp/js/jquery.sidebar.js',
        feo.resolve(
          '',
          'http://sideroad.secret.jp/plugins/jQuerySideBar/',
          '../../js/jquery.sidebar.js'
        )
      );

      assert.equal(
        'http://sideroad.secret.jp/js/jquery.sidebar.js',
        feo.resolve(
          '',
          'http://sideroad.secret.jp/plugins/jQuerySideBar/',
          'http://sideroad.secret.jp/js/jquery.sidebar.js'
        )
      );

      done();

    });


  });

  describe('#isLocal()', function(){
    it('should return local', function(done){
      assert.equal( false,  feo.isLocal("http://sideroad.secret.jp/") );
      assert.equal( false,  feo.isLocal("https://sideroad.secret.jp/") );
      assert.equal( true, feo.isLocal("test/src/script.html") );
      assert.equal( true, feo.isLocal("aaa.html") );
      done();
    });
  });

  describe('#optimizeScript()', function(){
    it('should concat and minify script files', function(done){
      var url = 'test/src/script.html',
          dist = 'test/dist';

      this.timeout(5000);
      jsdom.env({
          html : url, 
          scripts : [
            'http://code.jquery.com/jquery-1.8.0.min.js'
        ],
        done : function(err, window) {
          err && console.log(err);
          var $ = window.$;

          assert.equal( 11, $('script').not('.jsdom').length );

          feo.optimizeScript( {
            dist : dist,
            js : {
              ignore :["ignore.js"]
            },
            url : url,
            clean:true,
            log : false
            }, window, function(){

              assert.equal(
                fs.readFileSync('test/expect/feo.4d2a13ebe2f687649ed636cf6c818b21.js', 'utf8'),
                fs.readFileSync('test/dist/feo.4d2a13ebe2f687649ed636cf6c818b21.js', 'utf8')
              );


              assert.equal(5, $('script').not('.jsdom').length );
              done();
            }
          );
        }
      });
    });
  });

  describe('#optimizeCss()', function(){
    it('should concat and minify css files', function(done){
      var url = 'test/src/css.html',
          dist = 'test/dist';

      this.timeout(5000);
      jsdom.env({
          html : url, 
          scripts : [
            'http://code.jquery.com/jquery-1.8.0.min.js'
        ],
        done : function(err, window) {
          err && console.log(err);
          var $ = window.$;

          assert.equal( 8, $('link,style').length );
          feo.optimizeCss( {
              dist : dist,
              css : {
                ignore :["ignore.css"],
              },
              url : url,
              clean:true,
              log : false
            }, window, function(){
              assert.equal(
                fs.readFileSync('test/expect/feo.c9cd3ab4b9445f6507b25cab1237f32c.css', 'utf8'),
                fs.readFileSync('test/dist/feo.c9cd3ab4b9445f6507b25cab1237f32c.css', 'utf8')
              );

              assert.equal(3, $('link,style').length );
              done();
            }
          );
        }
      });
    });
  });

  describe('#optimizeBackgroundImage()', function(){
    it('should encode to base64', function(done){
      var url = 'test/src/1.css',
        dist = 'test/dist';

      feo.optimizeBackgroundImage( {
          dist : dist,
          css : {
            ignore :["ignore.css"]
          },
          url : url,
          clean:true,
          log : false
        }, 'test/src/css.html', fs.readFileSync(url, 'utf8'), function( err, body ){
          assert.equal(
            fs.readFileSync('test/expect/feo.background.image.css', 'utf8'),
            body
          );
          done();
        }
      );
    });
  });

  describe('#optimizeImage()', function(){
    it('should encode to base64', function(done){
      var url = 'test/src/image.html',
          dist = 'test/dist';

      this.timeout(5000);
      jsdom.env({
          html : url, 
          scripts : [
            'http://code.jquery.com/jquery-1.8.0.min.js'
        ],
        done : function(err, window) {
          err && console.log(err);
          var $ = window.$;

          assert.equal( 7, $('img').length );
          feo.optimizeImage( {
              dist : dist,
              image : {
                ignore :["ignore.png"]
              },
              url : url,
              clean:true,
              log : false
            }, window, function(){

              assert.equal( 7, $('img').length );
              assert.equal(
                fs.readFileSync('test/expect/feo.image.html', 'utf8'),
                window.document.innerHTML
              );

              done();
            }
          );
        }
      });

    });
  });
});
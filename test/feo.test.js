var assert = require("assert"),
    feo = require("../lib/feo"),
    jsdom = require("jsdom"),
    fs = require("fs"),
    path = require("path");

describe('feo', function(){
  describe('#init()', function(){
    it('should be cleaning dist', function(done){
      feo.init({dist:'dist',clean:true});
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

          assert.equal( 10, $('script').not('.jsdom').length );

          feo.optimizeScript( {
            dist : dist,
            js : {
              ignore :["ignore.js"]
            },
            url : url,
            clean:true
            }, window, function(){
              assert.equal(
                fs.readFileSync('test/expect/feo.63c826b58465ece78d6bb519beb0bad6.js', 'utf8'),
                fs.readFileSync('test/dist/feo.63c826b58465ece78d6bb519beb0bad6.js', 'utf8')
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

          assert.equal( 7, $('link,style').length );
          feo.optimizeCss( {
              dist : dist,
              css : {
                ignore :["ignore.css"],
              },
              url : url,
              clean:true
            }, window, function(){
              assert.equal(
                fs.readFileSync('test/expect/feo.788281c251f120e5f76f0de4e9b095d6.css', 'utf8'),
                fs.readFileSync('test/dist/feo.788281c251f120e5f76f0de4e9b095d6.css', 'utf8')
              );

              assert.equal(4, $('link,style').length );
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
          clean:true
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

          assert.equal( 6, $('img').length );
          feo.optimizeImage( {
              dist : dist,
              image : {
                ignore :["ignore.png"]
              },
              url : url,
              clean:true
            }, window, function(){

              assert.equal( 6, $('img').length );
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
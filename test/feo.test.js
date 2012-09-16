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

          feo.init({dist:dist,clean:true});
          feo.optimizeScript( {
            local : true,
            dist : dist,
            js : {
              ignore :["ignore.js"]
            },
            url : url,
            clean:true
            }, window, function(){
              var files = fs.readdirSync(dist);

              assert.equal(2, files.length);
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
          feo.init({dist:dist,clean:true});
          feo.optimizeCss( {
              local : true,
              dist : dist,
              css : {
                ignore :["ignore.css"]
              },
              url : url,
              clean:true
            }, window, function(){
              var files = fs.readdirSync(dist);

              assert.equal(2, files.length);
              assert.equal(
                fs.readFileSync('test/expect/feo.3101d7226176f32620984be4a633e4c1.css', 'utf8'),
                fs.readFileSync('test/dist/feo.3101d7226176f32620984be4a633e4c1.css', 'utf8')
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

      feo.init({dist:dist,clean:true});
      feo.optimizeBackgroundImage( {
          local : true,
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
          feo.init({dist:dist,clean:true});
          feo.optimizeImage( {
              local : true,
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
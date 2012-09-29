"use strict";


var jsdom = require('jsdom'),
  async = require('async'),
  request = require('request'),
  fs = require('fs'),
  path = require('path'),
  compressor = require('node-minify'),
  htmlMinifier = require('html-minifier'),
  crypto = require('crypto'),
  url = require('url'),
  wrench = require('wrench'),
  Iconv = require('iconv-jp').Iconv,
  _ = require('underscore');


exports.isLocal = function( target ){
  return (/^http/).test( target ) ? false : true;
};

exports.resolve = function( root, base, target ){

  if(this.isLocal(base)){

    return !this.isLocal(target) ? url.resolve( base, target ) :
           !/^\//.test( target ) ? path.resolve( path.dirname( base ), target ) :
           !this.isLocal(root)   ? url.resolve( root, target) :
                                   path.join( root, target );
  } else {
    return  url.resolve(base, target || '');
  }
};

exports.log = function( level, msg ){
  var logLevel = this.logLevel || 2;

  if( logLevel <= level && msg ){
    console.log( msg );
  }
};

exports.init = function( config ){
  var dist = config.dist;

  exports.log(1, "Cleaning dist : ");
  exports.log(1, "  "+dist);
  fs.existsSync(dist) && wrench.rmdirSyncRecursive(dist) && fs.rmdirSync( dist );
  fs.mkdirSync(dist);
};

exports.optimizeScript = function( config, window, callback){
  var js = config.js || {},
      compType = js.compressor || 'yui-js',
      ignore = js.ignore || [],
      inline = js.inline === undefined ? true : js.inline,
      root = js.root,
      dist = config.dist || 'dist',
      $ = window.$,
      scripts = $('script')
                .not(function(){
                  var elem = $(this);
                  return (this.src && ignore.indexOf( path.basename( this.src ) ) > -1) ? true :
                         !this.src && $.trim( elem.text() ) && !inline ? true :
                         elem.data("feo") == "ignore" ? true :
                         this.type && !/^text\/javascript$/ig.test(this.type) ? true : false;

                }),
      srcs = scripts.get(),
      encoding = config.encoding || 'utf8',
      that = this;

  exports.log(1, "Compaction scripts : ");
  async.map(srcs,
    function(item, callback){
      var src = item.src,
          charset = ( item.charset || encoding || 'utf8' ).toLowerCase(),
          innerScript = $.trim( $(item).text() ),
          srcUrl;

      srcUrl = that.resolve( root, config.url, src );
      exports.log(1, "  "+(src ? srcUrl : "inline"));
      if( !src && innerScript){
        callback(null, innerScript);
        return;
      }

      that.load(srcUrl, config.proxy, charset, function(err, body){
          exports.log(2, err);
          callback( null, body );
      });

    },
    function(err, results){
      var compressed = results.join(';\n');

      if(!config.suffix) {
        config.suffix = {};
      }
      config.suffix.js = crypto.createHash('md5').update(compressed).digest('hex');
      fs.writeFileSync(dist+'/feo.'+config.suffix.js+'.unpack.js', compressed.replace(/¥/g, '\\'));
      new compressor.minify({
        type: compType,
        fileIn: dist+'/feo.'+config.suffix.js+'.unpack.js',
        fileOut: dist+'/feo.'+config.suffix.js+'.js',
        callback: function(err){
          exports.log(2, err);
          scripts.remove();
          $('script.jsdom').remove();
          callback();
        }
      });
    }
  );

};

exports.optimizeCss = function(config, window, callback){
  var css = config.css || {},
      bg = config.backgroundImage || {},
      base64 = bg.base64 === undefined ? true : bg.base64,
      compType = css.compressor  || 'yui-css',
      ignore = css.ignore || [],
      inline = css.inline === undefined ? true : css.inline,
      dist = config.dist,
      root = css.root,
      encoding = config.encoding || 'utf8',
      $ = window.$,
      links = $('link[href][rel=stylesheet],style')
          .not(function(){
              var elem = $(this);
              return (this.href && ignore.indexOf( path.basename( this.href ) ) > -1) ? true :
                     !this.href && $.trim( elem.text() ) && !inline ? true :
                     elem.data("feo") == "ignore" ? true : false;
          }),
      that = this;


  exports.log(1, "Compaction css : ");
  async.map(links.get(),
    function(item, callback){
      var href = item.href,
          innerStyle = $.trim( $(item).text() ),
          hrefUrl;

      hrefUrl = that.resolve( root, config.url, href );
      exports.log(1, "  "+ (href ? hrefUrl : "inline"));

      if( !href && innerStyle){
        that.optimizeBackgroundImage( config, config.url, innerStyle, callback );
        return;
      }

      that.load(hrefUrl, config.proxy, encoding, function(err, body){
          exports.log(2, err);
          base64 ? that.optimizeBackgroundImage( config, hrefUrl, body || '', callback ) :
                   callback(null, body);
      });

    },
    function(err, results){
      var compressed = results.join('\n');

      if(!config.suffix) {
        config.suffix = {};
      }
      config.suffix.css = crypto.createHash('md5').update(compressed).digest('hex');
      fs.writeFileSync(dist+'/feo.'+config.suffix.css+'.unpack.css', compressed);
      new compressor.minify({
        type: compType,
        fileIn: dist+'/feo.'+config.suffix.css+'.unpack.css',
        fileOut: dist+'/feo.'+config.suffix.css+'.css',
        callback: function(err){
          exports.log(2, err);
          links.remove();
          callback();
        }
      });
    }
  );
};

exports.optimizeBackgroundImage = function( config, href, body, callback){
  var css = config.css || {},
      root = css.root,
      backgroundImages = (body.match(/url\([^\)]+\)/g)||[]).map(function(str){
        str = str.replace(/[\"\']/g,'');
        if(!/\.(jpg|gif|png|bmp)\)$/i.test(str)){
          return "";
        }
        return str.match(/\(([^\)]+)\)/)[1];
      }),
      that = this;

  exports.log(1, "Optimizing background-image :");
  async.map(backgroundImages, function(item, callback){
    var imageUrl;

    if(!item){
      callback();
      return;
    }
    imageUrl = that.resolve( root, href, item );
    exports.log(1, "  "+ imageUrl);

    that.load( imageUrl, config.proxy, 'binary', function(err, bgBody){
        exports.log(2, err);
        var ext = item.match(/\.([^.]+)$/)[1],
            reg = new RegExp("url\\([\\'\\\"]?"+item+"[\\'\\\"]?\\)", "g");
        if(bgBody) body = body.replace(reg, "url(data:image/"+ext+";base64,"+(new Buffer(bgBody, 'binary').toString('base64'))+")");
        callback();
    });

  }, function(err){
    exports.log(2, err);
    callback( null, body );
  });
};

exports.optimizeImage = function( config, window, callback ){
  var image = config.image || {},
      ignore = image.ignore || [],
      base64 = image.base64 === undefined ? true : image.base64,
      $ = window.$,
      root = image.root,
      imgs = $('img[src]')
          .not(function(){
              var elem = $(this);
              return ignore.indexOf( path.basename( this.href ) ) > -1 ? true :
                     elem.data("feo") == "ignore" ? true : false;
          }),
      that = this;

  exports.log(1, "Optimizing image : ");
  base64 ? async.map(imgs.get(),
    function(item, callback){
      var src = item.src,
          ext = (src.match(/\.([^.]+)$/)||[])[1],
          imageUrl;

      if(!src || !/^(jpg|gif|png|bmp)$/i.test(ext)){
        callback();
        return;
      }
      imageUrl = that.resolve( root, config.url, src );
      exports.log(1, "  "+ imageUrl);

      that.load(imageUrl, config.proxy, 'binary', function(err, body){
          if(body) item.src = "data:image/"+ext+";base64,"+(new Buffer(body, 'binary').toString('base64'));
          callback();
      });

    },
    function(err){
        exports.log(2, err);
        callback();
    }
  ) : callback();
};

exports.optimizeHtml = function( config, window, callback ){
  var $ = window.$,
      dist = config.dist,
      html,
      basename;

  exports.log(1, "Optimize HTML");
  $('head').append('<link type="text/css" rel="stylesheet" href="feo.'+config.suffix.css+'.css" >');
  html = '<!DOCTYPE html>\n<html>'+$('html').html()+'\n<script charset="utf-8" src="feo.'+config.suffix.js+'.js" type="text/javascript" ></script>\n</html>';

  basename = this.isLocal(config.url) ? path.basename(config.url, '.html') : config.url.replace(/\.html$/,'').split("/").pop() || 'index';

  html = html.replace( /<meta\b[^>]*charset=([\w\-]+)/i, function(str, match){
    return str.replace(match, 'UTF-8');
  });
  fs.writeFileSync(dist+'/'+basename+'.unpack.html', html );
  fs.writeFileSync(dist+'/'+basename+'.html', htmlMinifier.minify(html,{
    removeComments: true,
    collapseWhitespace: true
  }));
  callback();
};

exports.load = function( url, proxy, encoding, callback ){
  this.isLocal(url) ?
    fs.readFile( url, 'binary', function(err, body){
      callback(err, encoding == 'binary' ? body :
                    body                 ? exports.convert(encoding, '', body)
                                         : '' );
    })
  : request({
        uri : url,
        encoding : null,
        proxy : proxy || null
      }, function(err, request, body){
        callback(err, encoding == 'binary' ? body :
                      body                 ? exports.convert(encoding, request.headers['content-type'], body)
                                           : '' );
      }
    );
};

exports.convert = function(charset, contentType, buf) {
  if (contentType) {
    charset = charset || (contentType.match(/\bcharset=([\w\-\_]+)\b/i)||[])[1];
  }

  charset = charset || (buf.toString().match(/<meta\b[^>]*charset=([\w\-\_]+)/i)||[null, 'utf-8'])[1];
  return charset == 'utf-8' ? buf.toString(charset)
                            : new Iconv(charset, 'UTF-8').convert(buf).toString('utf8');
};

exports.optimize = function(config, callback ){
  var that = this;

  exports.log(4, "Target : ");
  exports.log(4, "  "+config.url);

  this.load(config.url, config.proxy, null, function(err, body){
    jsdom.env({
      html: body,
      src: [
        fs.readFileSync( path.join( __dirname, 'jquery-1.8.0.min.js' ), 'utf8').toString()
      ],
      done: function(err, window) {
        if(err) {
          exports.log(3, err);
          callback();
          return;
        }
        var $ = window.$,
            charset = (($('meta[content*=charset]').attr('content')||'').match(/charset=([^;]+)/)||[])[1]||window.document.charset||'utf8';
        config.encoding = config.encoding || charset;

        async.waterfall([function(callback){
          that.optimizeScript( config, window, callback );
        },function(callback){
          that.optimizeCss( config, window, callback );
        },function(callback){
          that.optimizeImage( config, window, callback );
        },function(callback){
          that.optimizeHtml( config, window, callback );
        }],function(){
          callback();
        });
      }
    });
  });

};

exports.cli = function( config ){
  var that = this;

  this.logLevel = config.logLevel;
  this.init( config );

  if( this.isLocal(config.url) && fs.statSync(config.url).isDirectory() ){
    fs.existFileSync && wrench.rmdirSyncRecursive(config.dist);
    wrench.copyDirSyncRecursive(config.url, config.dist);
    async.map(
      wrench.readdirSyncRecursive(config.dist).filter(function(val){
        return (/\.html/).test( val );
      }),
      function( item, callback ){
        var target = _.clone(config);

        target.url = path.resolve( config.dist, item );
        target.dist = path.dirname( path.resolve( config.dist, item ) );
        target.suffix = target.suffix || {};
        that.optimize( target, callback);
      },
      function( err ){
        if(err){
          exports.log(2, err );
        }
        exports.log(4, "Finished!!");
      }
    );
  } else {
    config.suffix = config.suffix || {};
    that.optimize( config, function(){
      exports.log(4, "Finished!!");
    });
  }
};

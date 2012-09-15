#!/usr/bin/env node

var jsdom = require('jsdom'),
  async = require('async'),
  request = require('request'),
  fs = require('fs'),
  compressor = require('node-minify'),
  htmlMinifier = require('html-minifier'),
  crypto = require('crypto'),
  url = require('url'),
  config = JSON.parse(fs.readFileSync('feo.json','utf8').toString().replace(/\n/g,'')) || {},
  js = config.js || {},
  css = config.css || {},
  html = config.html || {},
  image = config.image || {},
  jscomp = js.compressor || 'yui-js',
  jsignore = js.ignore || [],
  jsinline = js.inline || true,
  jsmd5 = crypto.createHash('md5'),
  csscomp = css.compressor  || 'yui-css',
  cssignore = css.ignore || [],
  cssinline = css.inline || false,
  cssmd5 = crypto.createHash('md5'),
  dist = html.dist || "dist",
  clean = html.clean || false,
  base64 = image.base64 || true,
  distFiles = [];

!fs.existsSync(dist) && fs.mkdirSync(dist);

if(clean){
  console.log("Cleaning dist...");
  distFiles = fs.readdirSync(dist) || [];
  for(i=distFiles.length;i--;){
    fs.unlinkSync(dist+"/"+distFiles[i]);
  }
}

console.log("URL : "+config.url);

jsdom.env({
  html: config.url,
  scripts: [
    'http://code.jquery.com/jquery-1.8.0.min.js'
  ],
  done: function(errors, window) {
    var $ = window.$,
        htmlCharset = (($('meta[content*=charset]').attr('content')||'').match(/charset=([^;]+)/)||[])[1]||window.document.charset||'utf8',
        scripts = $('script')
                    .not(function(){
                      var elem = $(this);
                      return jsignore.indexOf( this.src ) > -1 ? true : 
                             !this.src && $.trim( elem.text() ) && jsinline ? true : 
                             elem.data("feo-ignore") ? true : false;

                    }).not(':last'),
        links = $('link[href][rel=stylesheet],style')
                  .not(function(){
                      var elem = $(this);
                      return cssignore.indexOf( this.href ) > -1 ? true : 
                             !this.href && $.trim( elem.text() ) && cssinline ? true : 
                             elem.data("feo-ignore") ? true : false;

                  }),
        imgs = $('img[src]'),
        srcs = scripts.get();
        
    async.waterfall([function(callback){
        console.log("Compaction scripts : ");
        async.map(srcs,
          function(item, callback){
            var src = item.src,
                type = item.type,
                charset = ( item.charset || htmlCharset || 'utf8' ).toLowerCase().replace(/-|_/g,''),
                innerScript = $.trim( $(item).text() );
    
            if ( type && type!="text/javascript" ) {
              callback(null, '');
              return;
            }
            console.log(src||"inline");
            if( !src && innerScript){
              callback(null, innerScript);
              return;
            }
    
            request({
              uri      : url.resolve(config.url, src),
              encoding : 'utf8',
              proxy    : config.proxy || null
            },
            function(err, request, body) {
              callback( null, body );
            });
    
          },
          function(err, results){
            var comp = results.join(';\n');
            jssuffix = jsmd5.update(comp).digest('hex');
            fs.writeFileSync(dist+'/feo.'+jssuffix+'.unpack.js', comp);
            new compressor.minify({
              type: jscomp,
              fileIn: dist+'/feo.'+jssuffix+'.unpack.js',
              fileOut: dist+'/feo.'+jssuffix+'.js',
              callback: function(err){
                err && console.log(err);
                scripts.remove();
                $('script.jsdom').remove();
                callback();
              }
            });
    
    
          }
        );
    },function(callback){
        console.log("Compaction css : ");
        async.map(links.get(),
          function(item, callback){
            var href = item.href;
            if(!href){
              callback(null, '');
              return;
            }
            href = url.resolve(config.url, href);
            console.log(href || "inline");
            request({
              uri : href,
              encoding : 'utf8',
              proxy : config.proxy || null
            },
            function(err, requestHeader, body){
              var backgroundImages = (body.match(/url\([^\)]+\)/g)||[]).map(function(str){
                  if(!/\.(jpg|gif|png|bmp)\)$/i.test(str.replace(/[\"\']/g,""))){
                    return "";
                  }
                  return str.match(/\(([^\)]+)\)/)[1];
                });

              console.log("Optimizing background-image :");

              async.map(backgroundImages, function(item, callback){
                if(!item){
                  callback();
                  return;
                }
                console.log(item);
                request({
                  uri : url.resolve( href, item.replace(/[\"\']/g,"")),
                  encoding : 'binary',
                  proxy : config.proxy || null
                },function(err, request, bgBody){
                  var suffix = (item.replace(/[\'\"]/g,"").match(/\.([^.]+)$/)||[])[1],
                      reg = new RegExp("url\\("+item+"\\)", "g");
                  if(bgBody) body = body.replace(reg, "url(data:image/"+suffix+";base64,"+(new Buffer(bgBody, 'binary').toString('base64'))+")");
                  callback();
                });

              }, function(err, results){
                callback( null, body );
              });

            });

          },
          function(err, results){
            var comp = results.join(';\n');
            csssuffix = cssmd5.update(comp).digest('hex');
            fs.writeFileSync(dist+'/feo.'+csssuffix+'.unpack.css', results.join('\n'));
            new compressor.minify({
              type: csscomp,
              fileIn: dist+'/feo.'+csssuffix+'.unpack.css',
              fileOut: dist+'/feo.'+csssuffix+'.css',
              callback: function(err){
                err && console.log(err);
                links.remove();
                callback();
              }
            });
          }
        );
    },function(callback){
        console.log("Optimizing image : ");
        async.map(imgs.get(),
          function(item, callback){
            var src = item.src,
                suffix = (src.match(/\.([^.]+)$/)||[])[1];
            if(!src || !/\.(jpg|gif|png|bmp)$/i.test(src)){
              callback();
              return;
            }
            console.log(item.src);
            request({
              uri : url.resolve(config.url, src),
              encoding : 'binary',
              proxy : config.proxy || null
            },
            function(err, request, body){
              if(body) item.src = "data:image/"+suffix+";base64,"+(new Buffer(body, 'binary').toString('base64'));
              callback();
            });

          },
          function(err, results){
              callback();
          }
        );
    },function(callback){

        $('head').append('<link type="text/css" rel="stylesheet" href="feo.'+csssuffix+'.css" >');
        var html = '<!DOCTYPE html>\n<html>'+$('html').html()+'\n<script charset="utf-8" src="feo.'+jssuffix+'.js" type="text/javascript" ></script>\n</html>';

        fs.writeFileSync(dist+'/index.unpack.html', html);
        fs.writeFileSync(dist+'/index.html', htmlMinifier.minify(html,{
          removeComments: true,
          collapseWhitespace: true
        }));
        
    }]);

    
  }
});

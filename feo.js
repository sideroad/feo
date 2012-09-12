#!/usr/bin/env node

var jsdom = require('jsdom'),
  async = require('async'),
  request = require('request'),
  fs = require('fs'),
  compressor = require('node-minify'),
  crypto = require('crypto'),
  url = require('url'),
  config = JSON.parse(fs.readFileSync('feo.json','utf8').toString().replace(/\n/g,'')) || {},
  js = config.js || {},
  jscomp = js.compressor || 'yui-js',
  jsignore = js.ignore || [],
  jsinline = js.inline || true,
  jsmd5 = crypto.createHash('md5'),
  css = config.css || {},
  csscomp = css.compressor  || 'yui-css',
  cssignore = css.ignore || [],
  cssinline = css.inline || false,
  cssmd5 = crypto.createHash('md5'),
  html = config.html || {},
  dist = html.dist || "dist",
  clean = html.clean || false
  distFiles = [];

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
        srcs = scripts.get();

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
        var comp = results.join(';\n'),
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
            console.log("Compaction css : ");
            async.map(links.get(),
              function(item, callback){
                var href = item.href;
                if(!href){
                  callback(null, '');
                  return;
                }
                console.log(item.href || "inline");
                request({
                  uri : url.resolve(config.url, href),
                  encoding : 'utf8',
                  proxy : config.proxy || null
                },
                function(err, request, body){
                  callback( null, body );
                });

              },
              function(err, results){
                var comp = results.join(';\n'),
                    csssuffix = cssmd5.update(comp).digest('hex');
                fs.writeFileSync(dist+'/feo.'+csssuffix+'.unpack.css', results.join('\n'));
                new compressor.minify({
                  type: csscomp,
                  fileIn: dist+'/feo.'+csssuffix+'.unpack.css',
                  fileOut: dist+'/feo.'+csssuffix+'.css',
                  callback: function(err){
                    err && console.log(err);
                    links.remove();
                    $('head').append('<link type="text/css" rel="stylesheet" href="feo.'+csssuffix+'.css" >');
                    fs.writeFileSync(dist+'/index.unpack.html', '<!DOCTYPE html>\n<html>'+$('html').html()+'\n<script charset="utf-8" src="feo.'+jssuffix+'.js" type="text/javascript" ></script>\n</html>');
                  }
                });
              }
            );
          }
        });


      }
    );
  }
});

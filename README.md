#Optimize page for making faster!!

feo.json
```js
{
    "url":"http://sideroad.secret.jp/plugins/jQueryFloatingMessage/",
    "js" : {
        "compressor" : "yui-js",
        "ignore":[
          "http://code.jquery.com/jquery.min.js",
          "http://pagead2.googlesyndication.com/pagead/show_ads.js"
        ],
        "noinline":true
    },
    "css" : {
        "compressor" : "yui-css",
        "ignore":["hoge.css"],
        "noinline":false
    },
    "html" : {
        "dist" : "dist",
        "clean" : true
    }
}
```

Execute
```js
node feo.js
```

##Next
-HTML compaction
-Auto generate css sprite
-UTF-8 encoding page


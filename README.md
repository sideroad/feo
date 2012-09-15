#Optimize page for making faster!!

##Install
```sh
npm install feo
```

##Usage
Prepare feo.json
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

Execute feo
```sh
feo
```

##Next
* HTML compaction
* Auto generate css sprite
* UTF-8 encoding page

##Dependencies with amazing library
* async
* node-minify
* jsdom
* request

##Awesome article
* [Generating CSS Sprites With node.js](http://iambot.net/generating-css-sprites-with-node-dot-js.html)

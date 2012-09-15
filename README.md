#Optimize page for making faster!!

##Install
```sh
npm install -g feo
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
* UTF-8 encoding page
* Optimize html on local files

##Dependencies with amazing library
* async
* node-minify
* html-minifier
* jsdom
* request

##Awesome article
* [Generating CSS Sprites With node.js](http://iambot.net/generating-css-sprites-with-node-dot-js.html)
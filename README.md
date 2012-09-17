#Automatically optimize the web page faster!!

##Optimize principle
Manual optimizing front end is very sucks.
I want to simplify that. only one command.

* Concat and minify script and css files on the page
* Encode image files to base64 on the page( Off course! You need set Content-Encoding:gzip )
* Minify html

##Install
```sh
npm install -g feo
```

##Simple to use
1.Prepare feo.json
```js
{
    "url":"examples/src",
    "dist" : "examples/dist",
    "js" : {
        "compressor" : "yui-js",
        "ignore":[
          "ignore.js"
        ],
        "inline":false,
        "root" : "examples/src"
    },
    "css" : {
        "compressor" : "yui-css",
        "ignore":[
          "ignore.css"
        ],
        "inline":true,
        "root" : "examples/src"
    },
    "image" : {
        "base64" : true,
        "root" : "examples/src"
    }
}
```
2.Execute feo. Feo generates html, js and css files to dist directory.
```sh
feo
```
##Why output script, css files name contains hash?
* You can set long expire time of contents.

##Next
* For the page which is not UTF-8 encoding
* Optimize html on local files

##Dependencies with amazing library
* [async](https://github.com/caolan/async)
* [node-minify](https://github.com/srod/node-minify)
* [html-minifier](https://github.com/kangax/html-minifier)
* [jsdom](https://github.com/tmpvar/jsdom)
* [request](https://github.com/mikeal/request)

##Awesome article
* [Generating CSS Sprites With node.js](http://iambot.net/generating-css-sprites-with-node-dot-js.html)

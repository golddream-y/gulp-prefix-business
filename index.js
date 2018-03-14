'use strict';
var through = require('through2'),
    url = require("url"),
    urljoin = require("url-join"),
    trumpet = require("trumpet"),
    concat  = require("concat-stream"),
    _prefixer;

_prefixer = function(prefixObj, attr, invalid,wl) {
  return function(node) {
    node.getAttribute(attr, function(uri) {

      uri = url.parse(uri, false, true);

      var prefix;

        //获取去掉md5的路径
         function getDelMd5Path(input) {
           var pathArray = input.split('.');
           if(pathArray.length > 2){
             if(pathArray[pathArray.length-2].length === 8){
               var delMd5Path ='';
                 pathArray.splice(-2,1)
                 for(var k=0;k<pathArray.length;k++){
                     if(k===pathArray.length-1){
                         delMd5Path+=pathArray[k];
                     }else {
                         delMd5Path+=(pathArray[k]+ '.');
                     }
                 }
                 return delMd5Path;
             }
           }
           return input;
         }

        /**
         * 是否在白名单中
         * @param input
         * @returns {boolean}
         */
      function isExist(input) {
          for(var i=0;i<wl.length;i++){
            if(wl[i] === getDelMd5Path(input)){
              return true;
            }
          }
          return false;
      }


      if(uri.host || !uri.path)
        return;

        if(uri.path.indexOf('favicon.ico')!==-1){
            prefix = prefixObj.faviconPrefix;
        }else{
            if(!isExist(uri.path)){
                prefix = prefixObj.contextPath;
            }else {
                prefix = prefixObj.sourcePrefix;
            }

        }

        if(uri.path.indexOf('void(0)')!==-1){
            return;
        }

      if (!/^[!#$&-;=?-\[\]_a-z~\.\/\{\}]+$/.test(uri.path)) {
        return;
      }


      if (invalid && new RegExp(invalid).test(uri.path)){
        return;
      }

      var file_prefix = (typeof prefix === 'function') ? prefix(uri) : prefix;

      node.setAttribute(attr, urljoin(file_prefix, uri.path));
    });
  };
};

module.exports = function(prefix, selectors, ignore,wl) {

  return through.obj(function(file, enc, cb) {



    if (!selectors) {
      selectors = [
      { match: "script[src]", attr: "src" },
      { match: "link[href]", attr: "href"},
      { match: "img[src]", attr: "src"},
      { match: "input[src]", attr: "src"},
      { match: "img[data-ng-src]", attr: "data-ng-src"}
      ];
    }
    
    if(!prefix)
      cb(null, file);

    else {
      var tr = trumpet();
      
      for (var a in selectors)
        tr.selectAll(selectors[a].match, _prefixer(prefix, selectors[a].attr, ignore,wl))

      tr.pipe(concat(function (data) {
        if (Array.isArray(data) && data.length === 0) data = null;
        file.contents = data;
        cb(null, file);
      }));

      file.pipe(tr);
    } 
  });
};

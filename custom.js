var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
;faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');
var args = process.argv.slice(2);
var filePath = args[0];
file = args[0].substring(0, args[0].indexOf("."));
file1 = file.substring(file.indexOf("/")+1);

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);
  var max=0;
  traverse(result, function (node)
	{
      if(node.type === "IfStatement") {
        var count=1;
        traverseIf(node, function(child) {
          if(child.type=="LogicalExpression") {
            count=count+1;
          }
        });
        if(count>max) {
          max=count;
        }
      }
      if(node.type === "FunctionDeclaration" || node.type === "FunctionExpression") {
        if(node.body.loc.end.line - node.body.loc.start.line > 30){
          if(node.id !== null)
          console.log('Long Method from Function Declaration ' + node.id.name);
          else
          console.log("Long Method from expression");
        }
        if(node.params.length > 3) {
          if(node.id !== null)
          console.log('Long Parameter List from Function Declaration ' + node.id.name);
          else
          console.log("Long Parameter List From expression");
        }

      }
  });
  console.log('Max number of conditions in if ' + max);
}
function traverse(object, visitor)
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}
function traverseIf(object, visitor)
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (key!="consequent" && object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}
constraints(filePath);

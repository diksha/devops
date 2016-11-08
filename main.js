var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var faker = require("faker");
var fs = require("fs");
;faker.locale = "en";
var mock = require('mock-fs');
var _ = require('underscore');
var Random = require('random-js');
function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		args = ["subject.js"];
	}
	//var filePath = args[0];
	var filePath = args[0];
	file = args[0].substring(0, args[0].indexOf("."));
	file1 = file.substring(file.indexOf("/")+1);
	//constraints(filePath);

	constraints(filePath);

	generateTestCases()

}
var engine = Random.engines.mt19937().autoSeed();
function createConcreteIntegerValue( greaterThan, constraintValue )
{
	if( greaterThan )
		return Random.integer(constraintValue,constraintValue+10)(engine);
	else
		return Random.integer(constraintValue-10,constraintValue)(engine);
}

function Constraint(properties)
{
	this.ident = properties.ident;
	this.expression = properties.expression;
	this.operator = properties.operator;
	this.value = properties.value;
	this.funcName = properties.funcName;
	// Supported kinds: "fileWithContent","fileExists"
	// integer, string, phoneNumber
	this.kind = properties.kind;
}

function fakeDemo()
{
	//console.log( faker.phone.phoneNumber() );
	/*console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );*/
}

var functionConstraints =
{
}


var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {},
		'path/newDir': {
			'abc': 'def',
		}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content',
  			file2: '',
		}
	}
};

function generateTestCases()
{
	var content = "var "+file1+" = require('./"+file+".js')\nvar mock = require('mock-fs');\n";
	//var content = "var subject = require('./subject.js')\nvar mock = require('mock-fs');\n";
	for ( var funcName in functionConstraints )
	{
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			//params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			//params[paramName] = '\'\'';
			params[paramName] = [];
		}

		//console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {kind: 'fileWithContent' });
		var pathExists      = _.some(constraints, {kind: 'fileExists' });
		// plug-in values for parameters
		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];
			if( params.hasOwnProperty( constraint.ident ) )
			{
				params[constraint.ident].push(constraint.value);
			}
		}
		//console.log(params);	
		data=[];
		for(parameter in params){
			var a=[];
			for(var i=0;i<params[parameter].length;i++){
				a.push(params[parameter][i]);
			}
			data.push(a);
		}
		//console.log(funcName);
//console.log("dasdas");
		//console.log(data);
		//console.log(data);
		var start_elem = 0;
		var answer = [];
		generate(start_elem, []);
		function generate (num, str) {
			for(var b = 0 ; b < data[num].length ; b++)
			{
				next = num + 1;
				
					//console.log(data[next]);
				if( typeof data[next] !== 'undefined' )
				{
					str.push(data[num][b]);
					generate(next, str);
					str.splice(-1,1);				
				}
				else
				{	
					//console.log("Dsa");
					for(var a = 0; a < data[num].length ; a++)
					{
						var result = [];
						for(var z = 0; z < str.length ; z++)
						{
							result.push(str[z]);
						}

						result.push(data[num][a]);	
						answer.push(result);
						//console.log("pushing in answer");
					}
					break;
				}	
			}
		}
		//console.log(funcName);
			
			
		for(var i=0; i<answer.length; i++){
			var args = Object.keys(answer[i]).map( function(k) {return answer[i][k]; }).join(",");
			//console.log("entering");
		// Prepare function arguments.
		//var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");
			if( pathExists || fileWithContent )
			{
				content += generateMockFsTestCases(pathExists,fileWithContent,funcName, args);
				// Bonus...generate constraint variations test cases....
				content += generateMockFsTestCases(!pathExists,fileWithContent,funcName, args);
				content += generateMockFsTestCases(pathExists,!fileWithContent,funcName, args);
				content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName, args);
			}
			else
			{
				// Emit simple test case.
				content += file1+".{0}({1});\n".format(funcName, args );
				//content += "subject.{0}({1});\n".format(funcName, args );
			}
		}

	}


	fs.writeFileSync('test.js', content, "utf8");

}

function generateMockFsTestCases (pathExists,fileWithContent,funcName,args) 
{
	var testCase = "";
	// Build mock file system based on constraints.
	var mergedFS = {};
	//console.log(pathExists);
	//console.log(fileWithContent);
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
	}
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\t"+file+".{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
   var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);
//console.log(result);

var flag;
var node;
flag=0;
var funcName;
	traverse(result, function (node) 
	{
		/*if (node.type === 'ExpressionStatement') {
			traverse(node, function(child) {
				if(child.type === "AssignmentExpression") {
				traverse(child, function(right) {
					traverse(right,function(node) {
						if(node.type === "FunctionExpression") {
						flag=1;
						funcName = child.left.property.name;
						//nconsole.log(node);
			funcName = functionName(node);
			//console.log(node);
			//console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};
//			//console.log(functionConstraints[funcName]);

			// Check for expressions using argument.
			traverse(node, function(child)
			{
			//console.log(funcName);
			//console.log(child);
				if( child.type === 'BinaryExpression' && child.operator == "===")
				{
					console.log("Came here");
					if( child.left.type == 'CallExpression' && child.right.type == 'Identifier') {
						functionConstraints[funcName].constraints.push( 
							new Constraint(	//Constraint for string
							{
								ident: child.right.name,
								value:10, 
								funcName: funcName,	
								kind: "integer",
								operator : child.operator,
								expression: expression
							})
							);
					} 
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(	//Constraint for string
							{
								ident: child.left.name,
								value: '"stringCheck"',
								funcName: funcName,	
								kind: "string",
								operator : child.operator,
								expression: expression
							})
						);
					}
					if( child.left.type == 'Identifier' && child.left.name)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						var Number = '"' + "(" + String(child.right.value) + ")" + " " + "123-4567" + '"';
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[0],
								value: Number,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));

					}

				}
				if( child.type === 'BinaryExpression' && child.operator == "!=")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(	//Constraint for string
							{
								ident: child.left.name,
								value: '"stringCheck"',
								funcName: funcName,	
								kind: "string",
								operator : child.operator,
								expression: expression
							})
						);
					}
					if( child.left.type == 'Identifier' && child.left.name)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						var Number = '"' + "(" + String(child.right.value) + ")" + " " + "123-4567" + '"';
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[0],
								value: Number,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));

					}

				}
							

				if( child.type === 'BinaryExpression' && child.operator == "<")
				{
//console.log("dadsa");
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)-1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)+1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type === 'BinaryExpression' && child.operator == ">")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)+1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)-1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file2'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readdirSync" ) //https://nodejs.org/api/fs.html#fs_fs_readdirsync_path_options
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[1],
								value:  "'path/newDir'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: params[1],
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}
				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[1],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="replace")
				{	
					var phoneNum="'" + String(faker.phone.phoneNumber()) + "'";
					
					for( var p =0; p < params.length; p++ )
					{	
						
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  phoneNum,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							})
							);

					}
				}

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="substring")
				{	var phoneNum1="'" + String(faker.phone.phoneNumber()) + "'";
					
					for( var p =0; p < params.length; p++ )
					{	
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  phoneNum1,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							})
							);

					}
				}


				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="indexOf" )
				{	var temp = '"' + String(child.arguments[0].value) + '"';
					for( var p =0; p < params.length; p++ )
					{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.callee.object.name,
								value:  temp,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));
						
					}
				}
				if(child.type === 'UnaryExpression' && child.operator == '!')
				{
					if((undefined != child.argument.object) && (child.argument.type == "MemberExpression")){
						if(params.indexOf(child.argument.object.name) > -1){
							var expression = buf.substring(child.range[0], child.range[1]);
							var property = child.argument.property.name;
							var parameter;

							for(var i=0; i<params.length;i++){
								if(params[i] == child.argument.object.name){
									parameter = child.argument.object.name;
									break;
								}
							}

							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: parameter,
									value: child.argument.object.name + "={" + property + ": 'Random'}",
									funcName: funcName,
									kind: "Object",
									operator: child.operator,
									expression: expression
								}));
						}
					}
				}
			});

			//console.log( functionConstraints[funcName]);
						}
					
					});
				});
			}
			});
		}*/ 
		if (node.type === 'FunctionDeclaration') 
		{
			funcName = functionName(node);
			//console.log(node);
			//console.log("Line : {0} Function: {1}".format(node.loc.start.line, funcName ));

			var params = node.params.map(function(p) {return p.name});

			functionConstraints[funcName] = {constraints:[], params: params};
//			//console.log(functionConstraints[funcName]);

			// Check for expressions using argument.
			traverse(node, function(child)
			{
			//console.log(funcName);
			//console.log(child);
				if( child.type === 'BinaryExpression' && child.operator == "===")
				{

					if( child.left.type == 'CallExpression' && child.right.type == 'Identifier') {
						functionConstraints[funcName].constraints.push( 
							new Constraint(	//Constraint for string
							{
								ident: child.right.name,
								value:10, 
								funcName: funcName,	
								kind: "integer",
								operator : child.operator,
								expression: expression
							})
							);
					} 
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(	//Constraint for string
							{
								ident: child.left.name,
								value: '"stringCheck"',
								funcName: funcName,	
								kind: "string",
								operator : child.operator,
								expression: expression
							})
						);
					}
					if( child.left.type == 'Identifier' && child.left.name)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						var Number = '"' + "(" + String(child.right.value) + ")" + " " + "123-4567" + '"';
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[0],
								value: Number,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));

					}

				}
				if( child.type === 'BinaryExpression' && child.operator == "!=")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: rightHand,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(	//Constraint for string
							{
								ident: child.left.name,
								value: '"stringCheck"',
								funcName: funcName,	
								kind: "string",
								operator : child.operator,
								expression: expression
							})
						);
					}
					if( child.left.type == 'Identifier' && child.left.name)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])
						var Number = '"' + "(" + String(child.right.value) + ")" + " " + "123-4567" + '"';
						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[0],
								value: Number,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));

					}

				}
							

				if( child.type === 'BinaryExpression' && child.operator == "<")
				{
//console.log("dadsa");
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)-1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)+1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type === 'BinaryExpression' && child.operator == ">")
				{
					if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
					{
						var expression = buf.substring(child.range[0], child.range[1]);
						var rightHand = buf.substring(child.right.range[0], child.right.range[1])

						functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)+1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: child.left.name,
								value: parseInt(rightHand)-1,
								funcName: funcName,
								kind: "integer",
								operator : child.operator,
								expression: expression
							}));
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readFileSync" )
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file1'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: params[p],
								value:  "'pathContent/file2'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="readdirSync" ) //https://nodejs.org/api/fs.html#fs_fs_readdirsync_path_options
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[1],
								value:  "'path/newDir'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}),
							new Constraint(
							{
								ident: params[1],
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileWithContent",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}
				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="existsSync")
				{
					for( var p =0; p < params.length; p++ )
					{
						if( child.arguments[0].name == params[p] )
						{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[1],
								// A fake path to a file
								value:  "'path/fileExists'",
								funcName: funcName,
								kind: "fileExists",
								operator : child.operator,
								expression: expression
							}));
						}
					}
				}

				/*if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="replace")
				{	
					var phoneNum="'" + String(faker.phone.phoneNumber()) + "'";
					
					for( var p =0; p < params.length; p++ )
					{	
						
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  phoneNum,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							})
							);

					}
				}*/

				if( child.type == "CallExpression" &&
					 child.callee.property &&
					 child.callee.property.name =="substring")
				{	var phoneNum1="'" + String(faker.phone.phoneNumber()) + "'";
					
					for( var p =0; p < params.length; p++ )
					{	
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: params[p],
								value:  phoneNum1,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							})
							);

					}
				}


				if( child.type == "CallExpression" && 
					 child.callee.property &&
					 child.callee.property.name =="indexOf" )
				{	var temp = '"' + String(child.arguments[0].value) + '"';
					for( var p =0; p < params.length; p++ )
					{
							functionConstraints[funcName].constraints.push( 
							new Constraint(
							{
								ident: child.callee.object.name,
								value:  temp,
								funcName: funcName,
								kind: "string",
								operator : child.operator,
								expression: expression
							}));
						
					}
				}
				if(child.type === 'UnaryExpression' && child.operator == '!')
				{
					if((undefined != child.argument.object) && (child.argument.type == "MemberExpression")){
						if(params.indexOf(child.argument.object.name) > -1){
							var expression = buf.substring(child.range[0], child.range[1]);
							var property = child.argument.property.name;
							var parameter;

							for(var i=0; i<params.length;i++){
								if(params[i] == child.argument.object.name){
									parameter = child.argument.object.name;
									break;
								}
							}

							functionConstraints[funcName].constraints.push(
								new Constraint(
								{
									ident: parameter,
									value: child.argument.object.name + "={" + property + ": 'Random'}",
									funcName: funcName,
									kind: "Object",
									operator: child.operator,
									expression: expression
								}));
						}
					}
				}
			});

			//console.log( functionConstraints[funcName]);

		}
	});
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

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();

var acorn = require('acorn/dist/acorn_loose');
var walk = require("acorn/dist/walk");
var acorn_base = require("acorn");




/**
*	Loop over a function and get a list of things being called.
*
*	Tests to see if the function calls itself.
*	
*	Note: If it is an anonmyous function, recursion isn't possible.
*
*/
function get_function_names(input_node_src,scope){
	var func_name = "";
	var flag = true;

	// The name of the function can't appear anywhere.
	// No bracket suffix notation either.
	console.log("Searching for identifier '"+scope+"' in this code:");
	console.log(input_node_src);
	
	var tokens = acorn_base.tokenizer(input_node_src);
	var toke = tokens.getToken();
	while(toke.type != acorn_base.tokTypes.eof){
		if(toke.type.label == "name" && scope == toke.value){
			return true;
		}
		toke = tokens.getToken();
	}

	return false;
}




window.onload = function () {

	document.getElementById("parse").addEventListener("click",function(){
		var res = true;		

		var script = document.getElementById("input").value;

		var ast = acorn.parse_dammit(script).body[0];
		document.getElementById("output").innerHTML = JSON.stringify(ast, null, "\t"); // Indented with tab

		var flag = false;
		var amtloops = 0;

		// COUNTS LOOPS AND CONDITIONALS
		walk.simple(ast, {
			ForInStatement(node){
				if(amtloops > 3){return;}				
				console.log("ForInStatement");
				amtloops++;
			},
			ForStatement(node){
				if(amtloops > 3){return;}
				console.log("ForStatement");
				amtloops++;
			},
			DoWhileStatement(node){
				if(amtloops > 3){return;}
				console.log("DoWhileStatement");
				amtloops++;
			},
			WhileStatement(node){
				if(amtloops > 3){return;}
				console.log("WhileStatement");
				amtloops++;
			},
			IfStatement(node){
				if(amtloops > 3){return;}
				console.log("IfStatement");
				amtloops++;
			},
			SwitchStatement(node){
				if(amtloops > 3){return;}
				console.log("SwitchStatement");
				amtloops++;
			}
		});

		if(amtloops > 3){
			console.log("%c NONTRIVIAL: Too many loops/conditionals.","color:red");
			// TODO: return here
		}
		// DETECT RECURSION
		var nontrivial = false;
		walk.simple(ast, {
			CallExpression(node){
				if(nontrivial == true){
					return;
				}
				test_function_name(node.callee.name);
			}
		});

		if(nontrivial == true){
			console.log("%c NONTRIVIAL: Recursion detected.","color:red");
			res = false;// TODO: return here
		}




		document.getElementById("output").innerHTML =  res + "\n\n" + document.getElementById("output").innerHTML;		

	});

}


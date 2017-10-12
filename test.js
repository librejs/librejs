var acorn = require('acorn/dist/acorn_loose');
var walk = require("acorn/dist/walk");

window.onload = function () {

	document.getElementById("parse").addEventListener("click",function(){
	
		var ast = acorn.parse_dammit(document.getElementById("input").value).body[0];
		document.getElementById("output").innerHTML = JSON.stringify(ast, null, "\t"); // Indented with tab
		console.log(ast);

		var flag = false;
		var amtloops = 0;

		walk.recursive(ast, null, {
			Literal(node, state, c) {
				console.log("literal");
			},
			Identifier(node, state, c){
				if(state.called === true){
					console.log("calls '"+node.name+"'");
				}
			},
			// The beggining of an "object chain" (obj1.obj2().property.value......)
			ExpressionStatement(node, state, c) {
				c(node["expression"],{});
			},
			CallExpression(node, state, c) {
				console.log("CallExpression");
				c(node["callee"],{"called":true});
				for(var i = 0; i < node.arguments.length; i++){
					console.log(node.arguments[i]);
					c(node.arguments[i],{});
				}
			},
			MemberExpression(node, state, c){
				if(state.called === true){
					console.log("calls '"+node.property.name+"'");
				}
				c(node["object"],{});
			},
			ArrayExpression(node, state, c){
				var len = 0;
				try{
					var temp = script.substring(node["start"],node["end"]);
					len = JSON.parse(temp).length;
				} catch(e){
					console.warn("Invalid array?");
					len = 99;
				}
				if(len > 50){
					console.log("%c NONTRIVIAL: Array longer than 50 elements. ("+len+")","color:red");
					flag = false;
				}

			},
			ForInStatement(node, state, c){
				console.log("ForInStatement");
				amtloops++;
			},
			ForStatement(node, state, c){
				console.log("ForStatement");
				amtloops++;
			},
			DoWhileStatement(node, state, c){
				console.log("DoWhileStatement");
				amtloops++;
			},
			WhileStatement(node, state, c){
				console.log("WhileStatement");
				amtloops++;
			},
			IfStatement(node, state, c){
				console.log("IfStatement");
				c(node.test,{});
				c(node.consequent,{});
				amtloops++;
			},
			SwitchStatement(node, state, c){
				console.log("SwitchStatement");
				amtloops++;
			}

		});
		if(flag == false){
			return false;
		}
		if(amtloops > 3){
			console.log("%c NONTRIVIAL: Too many loops/conditionals.","color:red");
			return false;
		}
	});

}


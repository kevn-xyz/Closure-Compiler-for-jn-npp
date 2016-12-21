(function(){
		
	function outputToMinFile(origfilen, text) {
		var minFilename = origfilen.substring(0, origfilen.lastIndexOf(".")) + ".min" + origfilen.substring(origfilen.lastIndexOf("."));
		open(minFilename);
		
		currentView.text = text;
	}
	function outputToOpositeView(text, lang) {
		var view = currentView;
		var file = view.file;
		
		MenuCmds.FILE_NEW();
		MenuCmds.VIEW_GOTO_ANOTHER_VIEW();
		MenuCmds.FORMAT_UTF_8();
		
		currentView.text = text;
		if (lang) {
			currentView.lang = (Editor.langs.indexOf(lang) == -1) ? 0 : Editor.langs.indexOf(lang); //setting currentView.lang to -1 seems to be fine but for safeties sake might aswell
		}
		view.file = file;
	}
	
	var minify = function () {
		if (currentView.text.length > 0){
			var xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			if (xmlHttp) {
				xmlHttp.open("POST", "https://closure-compiler.appspot.com/compile", true);
				xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == 4 && xmlHttp.responseText) {
						try {
							var responseObj = eval("("+xmlHttp.responseText+")");
							if (typeof responseObj.serverErrors != "undefined") {
								alert("The server returned an error.\nThe response will be printed to the oposite view.\n(Try clearing custom parameter)");
								outputToOpositeView(JSON.stringify(responseObj, null, "\t"), "JSON");
								return;
							}
							
							if (globalCCSettings.so.returnStats) {
								outputToOpositeView((function (statso) {
									var rs = "";
									for (var key in statso) {
										rs += key + ": " + statso[key] + "\n";
									}
									rs += "\n" + ((statso.originalGzipSize / statso.compressedGzipSize - 1) * 100) + "% saved.";
									return rs;
								})(responseObj.statistics));
							}
							
							outputToMinFile(cFullFilename, responseObj.compiledCode);
						} catch(e) {
							alert("Error");
						}
					}
				};
				
				var cFullFilename = Editor.currentView.files[Editor.currentView.file],
					jstosend = "&js_code=" + encodeURIComponent(currentView.text),
					params = "output_info=compiled_code&compilation_level="+ compilation_level.setting +"&output_format=json";
				if (globalCCSettings.so.returnStats) { params = "output_info=statistics&" + params; }
				params = globalCCSettings.so.customParam + params;
				var uriargs = params + jstosend;
				//alert(params);
				//alert(uriargs);
				xmlHttp.send(uriargs);
				alert("Sending request...");
			}
		} else {
			alert("Nothing to minify");
		}
	};
	
	
	/* 										MENU 									*/
	
	
	var ccjsmin = Editor.addMenu("ClosureCompiler");
		
	ccjsmin.addItem({
		text:"Minify current view",
		cmd:function(){
			minify();
		}
	});
	
	var compilation_level = {
		submenu: null,
		names: ["WHITESPACE_ONLY", "SIMPLE_OPTIMIZATIONS", "ADVANCED_OPTIMIZATIONS"],
		MenuItems: [],
		setting: null,
		setCompLvl: function (level) {
			for (var i = 0; i < compilation_level.MenuItems.length; i++) {
				if (i === level) { 
					compilation_level.MenuItems[i].checked = true;
					continue;
				}
				compilation_level.MenuItems[i].checked = false;
			}
			globalCCSettings.so.compilation_levelVal = level;
			globalCCSettings.update();
			compilation_level.setting = compilation_level.names[level];
		},
		init: function() {
			compilation_level.submenu = ccjsmin.addMenu("Compilation Level");
			for (var i=0;i<3;i++) {
				compilation_level.MenuItems.push(
					compilation_level.submenu.addItem({
						text: compilation_level.names[i],
						cmd: (function(i){ return function(){ compilation_level.setCompLvl(i); }; })(i)
					})
				);
			}
		}
	};
	compilation_level.init();
		
	
	var otherSettings = {
		menu: null,
		returnStats: null,
		language_out: {
			menu: null,
			items: []
		},
		customParam: null,
		init: function () {
			otherSettings.menu = ccjsmin.addMenu("Other Settings");
			otherSettings.returnStats = otherSettings.menu.addItem({
				text: "Return Statistics",
				cmd: function () {
					otherSettings.returnStats.checked = !otherSettings.returnStats.checked;
					globalCCSettings.so.returnStats = otherSettings.returnStats.checked;
					globalCCSettings.update();
				}
			});
			otherSettings.customParam = otherSettings.menu.addItem({
				text: "Custom POST Param",
				cmd: function () {
					Dialog.prompt("Custom POST Parameter", globalCCSettings.so.customParam, function(ncustomParam){
						globalCCSettings.so.customParam = ncustomParam;
						globalCCSettings.update();
					});	
				}
			});
		}
	};
	otherSettings.init();
	
	
	
	var globalCCSettings = {
		so: null,
		update: function () {
			GlobalSettings.set("ClosureCompiler",globalCCSettings.so);
			//alert(JSON.stringify(globalCCSettings));
		},
		init: function () {
			globalCCSettings.so = GlobalSettings.get("ClosureCompiler");
			if (typeof globalCCSettings.so == "undefined" || typeof globalCCSettings.so == null) {
				GlobalSettings.set("ClosureCompiler",{});
				globalCCSettings.init();
				return;
			}
			if (typeof globalCCSettings.so.compilation_levelVal != "undefined") {
				compilation_level.setCompLvl(globalCCSettings.so.compilation_levelVal);
			} else {
				compilation_level.setCompLvl(1);
			}
			if (typeof globalCCSettings.so.returnStats != "undefined") {
				otherSettings.returnStats.checked = globalCCSettings.so.returnStats;
			} else {
				globalCCSettings.so.returnStats = false;
				globalCCSettings.update();
			}
			if (typeof globalCCSettings.so.customParam == "undefined") {
				globalCCSettings.so.customParam = "";
				globalCCSettings.update();
			}
		}
	};
	globalCCSettings.init();
	
	ccjsmin.addItem({
		text:"Reset settings",
		cmd:function(){
			GlobalSettings.set("ClosureCompiler",{});
		}
	});
	
	
})();

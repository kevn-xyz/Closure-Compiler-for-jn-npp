(function(){
	var ccjsmin = Editor.addMenu("ClosureCompiler");
	
	function outputToMinFile(origfilen, text) {
		var minFilename = origfilen.substring(0, origfilen.lastIndexOf(".")) + ".min" + origfilen.substring(origfilen.lastIndexOf("."));
		open(minFilename);
		
		currentView.text = text;
	}
	function outputToOpositeView(text) {
		var view = currentView;
		var file = view.file;
		
		MenuCmds.FILE_NEW();
		MenuCmds.VIEW_GOTO_ANOTHER_VIEW();
		MenuCmds.FORMAT_UTF_8();
		
		currentView.text = text;
		view.file = file;
	}
	
	var minify = function () {
		if (currentView.text.length > 0){
			var xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			if (xmlHttp) {
				xmlHttp.open('POST', 'https://closure-compiler.appspot.com/compile', true); // http://192.168.0.120:8080
				xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlHttp.onreadystatechange = function () {
					if (xmlHttp.readyState == 4 && xmlHttp.responseText) {
						try {
							var compiledCode = eval("("+xmlHttp.responseText+")").compiledCode;
							//outputToOpositeView(compiledCode);
							outputToMinFile(cFullFilename, compiledCode);
						} catch(e) {
							alert("Error");
						}
					}
				};
				var cFullFilename = Editor.currentView.files[Editor.currentView.file],
					jstosend = "&js_code=" + encodeURIComponent(currentView.text),
					params = "output_info=compiled_code&compilation_level="+ compilation_level.setting +"&output_format=json",
					uriargs = params + jstosend;
				xmlHttp.send(uriargs);
				//alert("Sending request...");
			}
		} else {
			alert("Nothing to minify");
		}
	}
	
	function setCompLvl(level) {
		for (var i = 0; i < compilation_level.MenuItems.length; i++) {
			if (i === level) { 
				compilation_level.MenuItems[i].checked = true;
				continue;
			}
			compilation_level.MenuItems[i].checked = false;
		}
		GlobalSettings.set("ClosureCompiler",{"compilation_levelVal": level});
		compilation_level.setting = compilation_level.names[level];
	}
	
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
		setting: null
	};
	compilation_level.submenu = ccjsmin.addMenu("Compilation Level");
	for (i=0;i<3;i++) {
		compilation_level.MenuItems.push(
			compilation_level.submenu.addItem({
				text: compilation_level.names[i],
				cmd: (function(i){ return function(){ setCompLvl(i); } })(i)
			}));
	}
	
	var globalCCSettings = GlobalSettings.get("ClosureCompiler");
	if (globalCCSettings && globalCCSettings.compilation_levelVal) {
		setCompLvl(globalCCSettings.compilation_levelVal);
	} else {
		GlobalSettings.set("ClosureCompiler",{"compilation_levelVal": 1});
		setCompLvl(1);
	}
	
})();
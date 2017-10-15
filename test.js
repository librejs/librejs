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

var fname_data = {"undefined":"trivial","Array":"trivial","Boolean":"trivial","JSON":"trivial","Date":"trivial","Math":"trivial","Number":"trivial","String":"trivial","RegExp":"trivial","Error":"non-trivial","InternalError":"trivial","EvalError":"non-trivial","RangeError":"trivial","ReferenceError":"trivial","SyntaxError":"trivial","TypeError":"trivial","URIError":"trivial","StopIteration":"trivial","ArrayBuffer":"non-trivial","Int8Array":"non-trivial","Uint8Array":"non-trivial","Int16Array":"non-trivial","Uint16Array":"non-trivial","Int32Array":"non-trivial","Uint32Array":"non-trivial","Float32Array":"non-trivial","Float64Array":"non-trivial","Uint8ClampedArray":"non-trivial","Proxy":"non-trivial","WeakMap":"non-trivial","Map":"non-trivial","Set":"non-trivial","DataView":"trivial","Symbol":"trivial","SharedArrayBuffer":"non-trivial","Intl":"trivial","TypedObject":"trivial","Reflect":"non-trivial","SIMD":"non-trivial","WeakSet":"trivial","Atomics":"non-trivial","Promise":"trivial","WebAssembly":"non-trivial","NaN":"trivial","Infinity":"trivial","isNaN":"trivial","isFinite":"trivial","parseFloat":"trivial","parseInt":"trivial","escape":"trivial","unescape":"trivial","decodeURI":"trivial","encodeURI":"trivial","decodeURIComponent":"trivial","encodeURIComponent":"trivial","uneval":"non-trivial","CSSStyleRule":"trivial","HTMLTimeElement":"trivial","SpeechSynthesisErrorEvent":"non-trivial","BatteryManager":"non-trivial","AudioContext":"non-trivial","CanvasGradient":"trivial","HTMLPictureElement":"non-trivial","HTMLMenuItemElement":"non-trivial","DOMStringMap":"non-trivial","HTMLFormElement":"non-trivial","BeforeUnloadEvent":"non-trivial","CSSFontFaceRule":"trivial","CSSPrimitiveValue":"trivial","HTMLOptionElement":"non-trivial","WebGLShader":"non-trivial","TextDecoder":"trivial","MediaKeys":"trivial","HTMLCanvasElement":"non-trivial","CSSStyleDeclaration":"trivial","HTMLTableSectionElement":"non-trivial","RTCDTMFSender":"non-trivial","Plugin":"non-trivial","AudioBuffer":"non-trivial","HTMLSelectElement":"non-trivial","CustomEvent":"non-trivial","PageTransitionEvent":"trivial","SVGPoint":"trivial","PushManager":"non-trivial","ChannelMergerNode":"non-trivial","SVGEllipseElement":"trivial","CSSStyleSheet":"trivial","RTCStatsReport":"non-trivial","SVGRadialGradientElement":"trivial","PerformanceResourceTiming":"non-trivial","PopupBlockedEvent":"non-trivial","SVGComponentTransferFunctionElement":"trivial","CSSPageRule":"trivial","SVGPathSegCurvetoQuadraticAbs":"trivial","SVGAnimatedNumberList":"trivial","MediaKeyError":"non-trivial","VRStageParameters":"non-trivial","CloseEvent":"trivial","SVGPathSegCurvetoQuadraticSmoothRel":"trivial","RTCTrackEvent":"non-trivial","ServiceWorker":"non-trivial","SVGFEColorMatrixElement":"non-trivial","HTMLUListElement":"non-trivial","ProgressEvent":"trivial","MutationEvent":"non-trivial","MessageEvent":"trivial","TextTrackCueList":"non-trivial","FocusEvent":"trivial","SVGPathSegLinetoHorizontalAbs":"trivial","PerformanceEntry":"non-trivial","TextTrackList":"non-trivial","StyleSheet":"trivial","DOMRectReadOnly":"non-trivial","HTMLMetaElement":"non-trivial","DOMException":"non-trivial","PerformanceMeasure":"non-trivial","DesktopNotificationCenter":"non-trivial","Comment":"non-trivial","DelayNode":"non-trivial","XPathResult":"non-trivial","MediaSource":"non-trivial","SVGLinearGradientElement":"trivial","WebGLShaderPrecisionFormat":"non-trivial","SVGStyleElement":"trivial","CDATASection":"non-trivial","HTMLLinkElement":"trivial","MessageChannel":"non-trivial","HTMLBaseElement":"trivial","IDBFileRequest":"non-trivial","SVGGraphicsElement":"trivial","HTMLDataListElement":"trivial","VRFrameData":"non-trivial","HTMLInputElement":"trivial","SVGPathSegMovetoRel":"trivial","TrackEvent":"trivial","HTMLMeterElement":"trivial","DeviceMotionEvent":"non-trivial","SVGStopElement":"trivial","BiquadFilterNode":"non-trivial","MediaDevices":"non-trivial","DOMRect":"trivial","CSSSupportsRule":"trivial","CSSMozDocumentRule":"trivial","SVGPathSegLinetoRel":"trivial","SVGFEConvolveMatrixElement":"trivial","HTMLSourceElement":"trivial","SpeechSynthesisUtterance":"non-trivial","Crypto":"non-trivial","Navigator":"non-trivial","FileList":"non-trivial","HTMLTrackElement":"non-trivial","WebGLQuery":"non-trivial","AudioBufferSourceNode":"non-trivial","SVGLineElement":"trivial","WebGLRenderbuffer":"non-trivial","SVGAnimatedAngle":"trivial","CSSKeyframeRule":"trivial","HTMLTableColElement":"trivial","DOMMatrix":"non-trivial","HTMLFieldSetElement":"trivial","WebGLSampler":"non-trivial","URLSearchParams":"trivial","WebGLUniformLocation":"non-trivial","ServiceWorkerContainer":"non-trivial","SVGPathSegLinetoAbs":"trivial","DOMMatrixReadOnly":"trivial","ValidityState":"non-trivial","DOMPointReadOnly":"trivial","ProcessingInstruction":"trivial","SVGPreserveAspectRatio":"trivial","SVGFEOffsetElement":"trivial","AbortSignal":"non-trivial","SVGFEImageElement":"trivial","TimeEvent":"non-trivial","FontFace":"trivial","FileReader":"non-trivial","SVGFEDiffuseLightingElement":"trivial","Worker":"non-trivial","External":"non-trivial","Audio":"non-trivial","IDBTransaction":"non-trivial","ImageBitmap":"non-trivial","MediaElementAudioSourceNode":"non-trivial","RTCDataChannelEvent":"non-trivial","TimeRanges":"non-trivial","Option":"non-trivial","TextTrack":"non-trivial","SVGElement":"trivial","SVGAnimatedNumber":"trivial","Image":"non-trivial","SVGTextElement":"trivial","DOMPoint":"trivial","HTMLDirectoryElement":"trivial","SVGFESpotLightElement":"trivial","VRDisplay":"non-trivial","AnimationTimeline":"trivial","SVGFEMorphologyElement":"trivial","IDBCursor":"non-trivial","SVGAngle":"trivial","VideoPlaybackQuality":"non-trivial","NodeList":"trivial","HTMLTableCellElement":"trivial","VTTCue":"non-trivial","SVGScriptElement":"trivial","HTMLStyleElement":"trivial","HTMLAudioElement":"trivial","Storage":"non-trivial","AudioNode":"non-trivial","PointerEvent":"non-trivial","XPathExpression":"non-trivial","CSSGroupingRule":"trivial","SVGFEDropShadowElement":"trivial","DOMQuad":"trivial","CharacterData":"non-trivial","BaseAudioContext":"non-trivial","SVGPathSegArcRel":"trivial","TextMetrics":"non-trivial","AudioListener":"non-trivial","MediaKeyStatusMap":"non-trivial","RTCPeerConnectionIceEvent":"non-trivial","MediaStreamTrackEvent":"trivial","HTMLLegendElement":"trivial","AnimationEffectReadOnly":"trivial","PerformanceTiming":"non-trivial","SVGNumber":"trivial","CSS2Properties":"trivial","MediaRecorder":"non-trivial","SVGGeometryElement":"trivial","PerformanceMark":"non-trivial","ImageBitmapRenderingContext":"non-trivial","SVGPathSegLinetoHorizontalRel":"trivial","SVGFEFuncBElement":"trivial","CSSFontFeatureValuesRule":"trivial","UserProximityEvent":"non-trivial","MediaQueryListEvent":"non-trivial","RTCCertificate":"non-trivial","Headers":"non-trivial","SVGClipPathElement":"trivial","IDBFileHandle":"non-trivial","StorageEvent":"non-trivial","CSSRuleList":"trivial","SVGPathSeg":"trivial","Range":"non-trivial","SVGUseElement":"trivial","CSSPseudoElement":"trivial","Rect":"trivial","DOMRequest":"non-trivial","HTMLOListElement":"trivial","SVGPathSegArcAbs":"trivial","AnimationEffectTimingReadOnly":"trivial","SVGPathSegCurvetoQuadraticSmoothAbs":"trivial","SVGRect":"trivial","RTCDTMFToneChangeEvent":"non-trivial","IDBMutableFile":"non-trivial","SVGAnimatedPreserveAspectRatio":"trivial","HTMLEmbedElement":"trivial","CSSMediaRule":"trivial","KeyframeEffect":"non-trivial","SVGImageElement":"trivial","MediaStream":"trivial","SVGGElement":"trivial","WebGLFramebuffer":"non-trivial","RTCPeerConnection":"non-trivial","HTMLTextAreaElement":"trivial","Permissions":"trivial","TextEncoder":"trivial","VRDisplayEvent":"non-trivial","SVGAnimatedEnumeration":"trivial","SVGAnimatedLengthList":"trivial","MediaStreamAudioSourceNode":"non-trivial","ImageData":"non-trivial","SVGFEFloodElement":"trivial","SpeechSynthesisVoice":"non-trivial","HTMLQuoteElement":"trivial","DOMParser":"trivial","StorageManager":"trivial","WebGLProgram":"non-trivial","TextTrackCue":"non-trivial","DOMTokenList":"trivial","SVGFECompositeElement":"trivial","OfflineAudioContext":"non-trivial","UIEvent":"non-trivial","HTMLMenuElement":"trivial","WebSocket":"non-trivial","DocumentType":"non-trivial","HTMLHeadElement":"trivial","SVGAElement":"trivial","SVGAnimatedBoolean":"trivial","SVGMaskElement":"trivial","HTMLUnknownElement":"trivial","HTMLBRElement":"trivial","GamepadButton":"non-trivial","HTMLProgressElement":"trivial","HTMLMediaElement":"trivial","SVGFilterElement":"trivial","HTMLFormControlsCollection":"trivial","HTMLCollection":"trivial","XPathEvaluator":"trivial","DragEvent":"non-trivial","VRFieldOfView":"non-trivial","MouseScrollEvent":"trivial","PerformanceNavigationTiming":"trivial","HTMLLIElement":"trivial","EventSource":"trivial","IdleDeadline":"trivial","AudioDestinationNode":"trivial","SVGPathSegLinetoVerticalRel":"trivial","AudioParam":"non-trivial","FileSystem":"non-trivial","MediaEncryptedEvent":"trivial","CSSCounterStyleRule":"trivial","FileSystemFileEntry":"non-trivial","CacheStorage":"non-trivial","MimeType":"trivial","PannerNode":"trivial","MutationObserver":"non-trivial","CSSImportRule":"trivial","HTMLDetailsElement":"trivial","NodeFilter":"non-trivial","SVGAnimatedInteger":"trivial","SVGTSpanElement":"trivial","MediaStreamTrack":"trivial","SVGMarkerElement":"trivial","SVGStringList":"trivial","GamepadHapticActuator":"non-trivial","SVGTransform":"trivial","StereoPannerNode":"trivial","console":"trivial","SVGPathElement":"trivial","MediaError":"trivial","HTMLObjectElement":"trivial","PopStateEvent":"non-trivial","MediaStreamAudioDestinationNode":"non-trivial","DynamicsCompressorNode":"non-trivial","DeviceProximityEvent":"non-trivial","PaintRequest":"non-trivial","RGBColor":"non-trivial","SVGTitleElement":"trivial","HTMLHeadingElement":"trivial","SpeechSynthesisEvent":"non-trivial","XMLHttpRequestEventTarget":"non-trivial","SVGFEBlendElement":"trivial","VRDisplayCapabilities":"non-trivial","ClipboardEvent":"non-trivial","FontFaceSet":"trivial","SVGTextPositioningElement":"trivial","SVGFEFuncGElement":"trivial","RTCIceCandidate":"non-trivial","OfflineAudioCompletionEvent":"non-trivial","CSSTransition":"trivial","IDBKeyRange":"non-trivial","PaintRequestList":"non-trivial","CSSAnimation":"trivial","AnimationPlaybackEvent":"trivial","SVGFEPointLightElement":"trivial","FileSystemEntry":"non-trivial","XMLDocument":"trivial","HTMLTableCaptionElement":"trivial","SourceBuffer":"non-trivial","Screen":"trivial","NamedNodeMap":"trivial","SVGAnimateElement":"trivial","SVGPolylineElement":"trivial","CSSValue":"trivial","History":"non-trivial","DeviceLightEvent":"non-trivial","StyleSheetList":"trivial","SVGDefsElement":"trivial","Response":"non-trivial","AnimationEffectTiming":"trivial","ServiceWorkerRegistration":"trivial","CanvasRenderingContext2D":"trivial","IDBVersionChangeEvent":"non-trivial","SVGPathSegList":"trivial","SVGAnimatedTransformList":"trivial","MediaStreamEvent":"trivial","HTMLPreElement":"trivial","SVGPathSegClosePath":"trivial","ScriptProcessorNode":"non-trivial","FileSystemDirectoryReader":"trivial","RTCRtpReceiver":"non-trivial","MimeTypeArray":"trivial","HTMLAllCollection":"trivial","CanvasCaptureMediaStream":"non-trivial","RTCRtpSender":"non-trivial","HTMLSpanElement":"trivial","CSSNamespaceRule":"trivial","SVGGradientElement":"trivial","HTMLFrameSetElement":"trivial","HTMLFontElement":"trivial","Directory":"trivial","mozRTCPeerConnection":"non-trivial","BlobEvent":"trivial","SVGSwitchElement":"trivial","PerformanceObserverEntryList":"trivial","SVGViewElement":"trivial","SVGUnitTypes":"trivial","PushSubscriptionOptions":"trivial","HTMLFrameElement":"trivial","DOMStringList":"trivial","MouseEvent":"trivial","SVGPathSegMovetoAbs":"trivial","Text":"trivial","GamepadAxisMoveEvent":"non-trivial","IntersectionObserverEntry":"trivial","SVGSymbolElement":"trivial","SVGFEFuncAElement":"trivial","WebGLContextEvent":"non-trivial","DOMImplementation":"trivial","WheelEvent":"trivial","MediaQueryList":"trivial","IDBObjectStore":"non-trivial","SubtleCrypto":"non-trivial","WebGL2RenderingContext":"non-trivial","InputEvent":"trivial","HashChangeEvent":"non-trivial","CSSRule":"trivial","Animation":"trivial","CSS":"trivial","HTMLAnchorElement":"trivial","AudioStreamTrack":"trivial","DataTransfer":"trivial","TreeWalker":"trivial","XMLHttpRequest":"non-trivial","VREyeParameters":"non-trivial","SVGAnimatedString":"trivial","SVGFEMergeElement":"trivial","CSSKeyframesRule":"trivial","LocalMediaStream":"non-trivial","ConvolverNode":"non-trivial","SVGPathSegLinetoVerticalAbs":"trivial","CSSConditionRule":"trivial","AudioScheduledSourceNode":"non-trivial","DeviceOrientationEvent":"non-trivial","WaveShaperNode":"non-trivial","SVGAnimationElement":"trivial","SVGPathSegCurvetoCubicAbs":"trivial","HTMLOptGroupElement":"trivial","DOMError":"trivial","DataTransferItemList":"non-trivial","Request":"non-trivial","HTMLVideoElement":"non-trivial","SourceBufferList":"non-trivial","SVGLength":"trivial","SVGTextPathElement":"trivial","SVGPolygonElement":"trivial","SVGAnimatedRect":"trivial","RTCSessionDescription":"non-trivial","MediaKeySystemAccess":"non-trivial","IDBFactory":"non-trivial","XSLTProcessor":"non-trivial","GamepadPose":"non-trivial","SVGPathSegCurvetoCubicRel":"trivial","HTMLModElement":"trivial","MediaDeviceInfo":"trivial","SVGFEFuncRElement":"trivial","HTMLHtmlElement":"trivial","XMLHttpRequestUpload":"trivial","SharedWorker":"trivial","WebGLTexture":"non-trivial","SVGLengthList":"trivial","Notification":"non-trivial","DOMRectList":"trivial","DataTransferItem":"non-trivial","CompositionEvent":"non-trivial","HTMLBodyElement":"trivial","SVGTextContentElement":"trivial","AnalyserNode":"non-trivial","MediaKeySession":"trivial","SVGFETurbulenceElement":"trivial","mozRTCIceCandidate":"non-trivial","PerformanceObserver":"non-trivial","OfflineResourceList":"non-trivial","WebGLRenderingContext":"non-trivial","FileSystemDirectoryEntry":"non-trivial","SVGMatrix":"trivial","DesktopNotification":"non-trivial","WebGLVertexArrayObject":"non-trivial","GamepadEvent":"non-trivial","HTMLTableElement":"trivial","MediaList":"non-trivial","SVGZoomAndPan":"trivial","SVGMetadataElement":"trivial","DataChannel":"non-trivial","IIRFilterNode":"non-trivial","IDBCursorWithValue":"non-trivial","ChannelSplitterNode":"non-trivial","KeyEvent":"non-trivial","MediaRecorderErrorEvent":"non-trivial","HTMLButtonElement":"trivial","File":"non-trivial","ConstantSourceNode":"non-trivial","CryptoKey":"non-trivial","GainNode":"non-trivial","AbortController":"non-trivial","SVGFEDistantLightElement":"non-trivial","Attr":"non-trivial","SpeechSynthesis":"non-trivial","SVGSVGElement":"trivial","Gamepad":"non-trivial","HTMLTableRowElement":"trivial","PushSubscription":"non-trivial","IDBOpenDBRequest":"non-trivial","SVGAnimateMotionElement":"trivial","SVGDescElement":"trivial","XMLStylesheetProcessingInstruction":"non-trivial","SVGPathSegCurvetoCubicSmoothRel":"trivial","NodeIterator":"trivial","HTMLAreaElement":"trivial","VideoStreamTrack":"non-trivial","SVGFESpecularLightingElement":"trivial","HTMLDataElement":"trivial","SVGFEGaussianBlurElement":"non-trivial","XMLSerializer":"non-trivial","SVGFEComponentTransferElement":"trivial","CaretPosition":"non-trivial","FormData":"non-trivial","SVGNumberList":"trivial","SVGTransformList":"trivial","WebGLActiveInfo":"non-trivial","SVGForeignObjectElement":"trivial","CanvasPattern":"non-trivial","SVGRectElement":"trivial","mozRTCSessionDescription":"non-trivial","Path2D":"non-trivial","HTMLParamElement":"trivial","SVGFEDisplacementMapElement":"trivial","SVGAnimateTransformElement":"trivial","ScrollAreaEvent":"trivial","HTMLLabelElement":"trivial","PerformanceNavigation":"trivial","GamepadButtonEvent":"non-trivial","KeyboardEvent":"non-trivial","TransitionEvent":"trivial","SVGAnimatedLength":"trivial","SVGPointList":"trivial","HTMLTemplateElement":"trivial","HTMLOptionsCollection":"trivial","SVGPatternElement":"trivial","ErrorEvent":"trivial","URL":"trivial","AnimationEvent":"trivial","SVGPathSegCurvetoCubicSmoothAbs":"trivial","PluginArray":"non-trivial","MutationRecord":"trivial","HTMLDivElement":"trivial","CSSValueList":"trivial","WebKitCSSMatrix":"trivial","HTMLIFrameElement":"trivial","PeriodicWave":"non-trivial","IDBRequest":"non-trivial","MediaKeyMessageEvent":"non-trivial","SVGCircleElement":"trivial","WebGLTransformFeedback":"non-trivial","DocumentFragment":"trivial","DOMCursor":"trivial","WebGLSync":"non-trivial","FontFaceSetLoadEvent":"trivial","DocumentTimeline":"non-trivial","IDBIndex":"non-trivial","SVGSetElement":"trivial","ScreenOrientation":"non-trivial","BroadcastChannel":"non-trivial","PermissionStatus":"non-trivial","IntersectionObserver":"non-trivial","SVGFETileElement":"trivial","HTMLTitleElement":"trivial","SVGMPathElement":"trivial","Blob":"trivial","MessagePort":"non-trivial","HTMLMapElement":"trivial","SVGFEMergeNodeElement":"trivial","BarProp":"non-trivial","VRPose":"non-trivial","SVGPathSegCurvetoQuadraticRel":"trivial","OscillatorNode":"non-trivial","Cache":"non-trivial","HTMLOutputElement":"trivial","HTMLDListElement":"trivial","HTMLParagraphElement":"trivial","IDBDatabase":"non-trivial","RadioNodeList":"non-trivial","AudioProcessingEvent":"non-trivial","WebGLBuffer":"non-trivial","KeyframeEffectReadOnly":"trivial","HTMLHRElement":"trivial","HTMLImageElement":"trivial","InstallTrigger":"non-trivial","Function":"trivial","Object":"trivial","eval":"non-trivial","EventTarget":"trivial","Window":"trivial","close":"trivial","stop":"trivial","focus":"trivial","blur":"trivial","open":"trivial","alert":"trivial","confirm":"trivial","prompt":"trivial","print":"trivial","postMessage":"non-trivial","captureEvents":"non-trivial","releaseEvents":"non-trivial","getSelection":"non-trivial","getComputedStyle":"trivial","matchMedia":"non-trivial","moveTo":"non-trivial","moveBy":"non-trivial","resizeTo":"non-trivial","resizeBy":"non-trivial","scroll":"trivial","scrollTo":"trivial","scrollBy":"trivial","requestAnimationFrame":"non-trivial","cancelAnimationFrame":"non-trivial","getDefaultComputedStyle":"non-trivial","scrollByLines":"trivial","scrollByPages":"trivial","sizeToContent":"trivial","updateCommands":"non-trivial","find":"trivial","dump":"trivial","setResizable":"non-trivial","requestIdleCallback":"non-trivial","cancelIdleCallback":"non-trivial","btoa":"trivial","atob":"trivial","setTimeout":"non-trivial","clearTimeout":"trivial","setInterval":"non-trivial","clearInterval":"non-trivial","createImageBitmap":"non-trivial","fetch":"non-trivial","self":"non-trivial","name":"non-trivial","history":"non-trivial","locationbar":"non-trivial","menubar":"non-trivial","personalbar":"non-trivial","scrollbars":"non-trivial","statusbar":"non-trivial","toolbar":"non-trivial","status":"non-trivial","closed":"non-trivial","frames":"non-trivial","length":"non-trivial","opener":"non-trivial","parent":"non-trivial","frameElement":"trivial","navigator":"non-trivial","external":"non-trivial","applicationCache":"non-trivial","screen":"non-trivial","innerWidth":"non-trivial","innerHeight":"non-trivial","scrollX":"non-trivial","pageXOffset":"non-trivial","scrollY":"non-trivial","pageYOffset":"non-trivial","screenX":"non-trivial","screenY":"non-trivial","outerWidth":"non-trivial","outerHeight":"non-trivial","performance":"non-trivial","mozInnerScreenX":"non-trivial","mozInnerScreenY":"non-trivial","devicePixelRatio":"non-trivial","scrollMaxX":"non-trivial","scrollMaxY":"non-trivial","fullScreen":"non-trivial","mozPaintCount":"non-trivial","ondevicemotion":"non-trivial","ondeviceorientation":"non-trivial","onabsolutedeviceorientation":"non-trivial","ondeviceproximity":"non-trivial","onuserproximity":"non-trivial","ondevicelight":"non-trivial","sidebar":"trivial","onvrdisplayconnect":"non-trivial","onvrdisplaydisconnect":"non-trivial","onvrdisplayactivate":"non-trivial","onvrdisplaydeactivate":"non-trivial","onvrdisplaypresentchange":"non-trivial","crypto":"non-trivial","onabort":"non-trivial","onblur":"non-trivial","onfocus":"non-trivial","onauxclick":"non-trivial","oncanplay":"non-trivial","oncanplaythrough":"non-trivial","onchange":"non-trivial","onclick":"non-trivial","onclose":"non-trivial","oncontextmenu":"non-trivial","ondblclick":"non-trivial","ondrag":"non-trivial","ondragend":"non-trivial","ondragenter":"non-trivial","ondragexit":"non-trivial","ondragleave":"non-trivial","ondragover":"non-trivial","ondragstart":"non-trivial","ondrop":"non-trivial","ondurationchange":"non-trivial","onemptied":"non-trivial","onended":"non-trivial","oninput":"non-trivial","oninvalid":"non-trivial","onkeydown":"non-trivial","onkeypress":"non-trivial","onkeyup":"non-trivial","onload":"trivial","onloadeddata":"non-trivial","onloadedmetadata":"non-trivial","onloadend":"non-trivial","onloadstart":"non-trivial","onmousedown":"non-trivial","onmouseenter":"non-trivial","onmouseleave":"non-trivial","onmousemove":"non-trivial","onmouseout":"non-trivial","onmouseover":"non-trivial","onmouseup":"non-trivial","onwheel":"non-trivial","onpause":"non-trivial","onplay":"non-trivial","onplaying":"non-trivial","onprogress":"non-trivial","onratechange":"non-trivial","onreset":"non-trivial","onresize":"non-trivial","onscroll":"non-trivial","onseeked":"non-trivial","onseeking":"non-trivial","onselect":"non-trivial","onshow":"non-trivial","onstalled":"non-trivial","onsubmit":"non-trivial","onsuspend":"non-trivial","ontimeupdate":"non-trivial","onvolumechange":"non-trivial","onwaiting":"non-trivial","onselectstart":"non-trivial","ontoggle":"non-trivial","onpointercancel":"non-trivial","onpointerdown":"non-trivial","onpointerup":"non-trivial","onpointermove":"non-trivial","onpointerout":"non-trivial","onpointerover":"non-trivial","onpointerenter":"non-trivial","onpointerleave":"non-trivial","ongotpointercapture":"non-trivial","onlostpointercapture":"non-trivial","onmozfullscreenchange":"non-trivial","onmozfullscreenerror":"non-trivial","onanimationcancel":"non-trivial","onanimationend":"non-trivial","onanimationiteration":"non-trivial","onanimationstart":"non-trivial","ontransitioncancel":"non-trivial","ontransitionend":"non-trivial","ontransitionrun":"non-trivial","ontransitionstart":"non-trivial","onwebkitanimationend":"non-trivial","onwebkitanimationiteration":"non-trivial","onwebkitanimationstart":"non-trivial","onwebkittransitionend":"non-trivial","onerror":"non-trivial","speechSynthesis":"non-trivial","onafterprint":"non-trivial","onbeforeprint":"non-trivial","onbeforeunload":"non-trivial","onhashchange":"non-trivial","onlanguagechange":"non-trivial","onmessage":"non-trivial","onmessageerror":"non-trivial","onoffline":"non-trivial","ononline":"non-trivial","onpagehide":"non-trivial","onpageshow":"non-trivial","onpopstate":"non-trivial","onstorage":"non-trivial","onunload":"non-trivial","localStorage":"non-trivial","origin":"non-trivial","isSecureContext":"non-trivial","indexedDB":"non-trivial","caches":"non-trivial","sessionStorage":"non-trivial","window":"trivial","document":"trivial","location":"non-trivial","top":"trivial","netscape":"non-trivial","Node":"non-trivial","Document":"trivial","HTMLDocument":"trivial","Performance":"non-trivial","startProfiling":"non-trivial","stopProfiling":"non-trivial","pauseProfilers":"non-trivial","resumeProfilers":"non-trivial","dumpProfile":"non-trivial","getMaxGCPauseSinceClear":"non-trivial","clearMaxGCPauseAccumulator":"non-trivial","Selection":"non-trivial","Element":"trivial","HTMLElement":"trivial","HTMLScriptElement":"trivial","Event":"trivial","Location":"non-trivial"}
function test_function_name(name){
	var res = fname_data[name];
	if(res == "trivial"){
		console.log("'"+name+"'"+" is trivial.");	
		return false;
	}
	if(res == "nontrivial"){
		console.log("%cNONTRIVIAL:'"+name+"'"+" is non-trivial.","color:red");	
		return true;	
	}
	console.log("%cNONTRIVIAL:'"+name+"'"+" is probably user defined.","color:red");	
	return false;

}

window.onload = function () {

	document.getElementById("parse").addEventListener("click",function(){
		var res = true;		

		var script = document.getElementById("input").value;
		if(script == "" || script === undefined){
			return true;
		}
		var ast = acorn.parse_dammit(script).body[0];
		document.getElementById("output").innerHTML = JSON.stringify(ast, null, "\t"); // Indented with tab

		var flag = false;
		var amtloops = 0;

		// COUNTS LOOPS AND CONDITIONALS
		walk.simple(ast, {
			ForInStatement(node){
				if(amtloops > 3){return;}				
				amtloops++;
			},
			ForStatement(node){
				if(amtloops > 3){return;}
				amtloops++;
			},
			DoWhileStatement(node){
				if(amtloops > 3){return;}
				amtloops++;
			},
			WhileStatement(node){
				if(amtloops > 3){return;}
				amtloops++;
			},
			IfStatement(node){
				if(amtloops > 3){return;}
				amtloops++;
			},
			SwitchStatement(node){
				if(amtloops > 3){return;}
				amtloops++;
			}
		});

		if(amtloops > 3){
			console.log("%c NONTRIVIAL: Too many loops/conditionals.","color:red");
			return false;
		}
		// Detect which objects are referenced and which functions are called
		// Only cares about top level objects. Window is special because we will test its methods.
		var nontrivial = false;

		function read(){

		}

		walk.simple(ast, {
			ExpressionStatement(node){
				if(nontrivial == true){
					return;
				}
				// Get the first thing in the expression	
				if(node === undefined){
					return;
				}			
				var lnode = node.expression;				
				var last_name = "";
				while(true){
					// window.test()
					if(lnode.type == "CallExpression"){
						if(lnode.property !== undefined){
							last_name = lnode.property.name;	
						}
						lnode = lnode.callee;
 					// window.test
					}else if(lnode.type == "MemberExpression"){
						last_name = lnode.property.name;
						// This may be bracket suffix notation
						lnode = lnode.object;			
					// We should be at the first in the chain.		
					}else if(lnode.type == "Identifier"){
						// Since window is the global object, it is special
						if(lnode.name == "window"){
							nontrivial = test_function_name(last_name);
							break;
						} else{
							nontrivial = test_function_name(lnode.name);
							break;
						}
					}else if(lnode.type == "BinaryExpression"){
						// This actually might not be valid. It can't be anything nontrivial.
						console.log("%c Warn: syntax not valid","color:Red;")
						break;
					} else{
						break;
					}
					//console.log(last_name+":"+lnode.name);
				},
				BinaryExpression(node){
					

				}			
			}
		});

		document.getElementById("output").innerHTML =  res + "\n\n" + document.getElementById("output").innerHTML;		

		if(nontrivial == true){
			return false;
		}

		return true;

	});

}


// listen for addon script emit and pass on the object to the page script.
self.port.on("populate-form", function (data) {
    // custom DOM event
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("populate-form", true, true, { data: data });
    document.documentElement.dispatchEvent(event);
});

/*self.port.on("rules-form-data-written", function (data) {
    // custom DOM event
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("rules-form-data-written", true, true, {});
    document.documentElement.dispatchEvent(event);
});*/

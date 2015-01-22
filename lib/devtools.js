(function($) {
    localStorage.version = '1.1.2';

	// store pending requests until panel is created
	var que = [];

	var providers = $.parseJSON(localStorage.getItem('api_sniffer.providers'));

    function leftOf(needle, haystack){
        var i = haystack.indexOf(needle);
        if (i < 0){
            return haystack;
        }
        return haystack.substring(0, i);
    }

	function isRestRequest(url) {
		var result = null;
		$.each(providers, function(i, provider) {
			if (provider.checked) {
                localStorage.url = url;
                localStorage.leftOfUrl = leftOf('?',url);
                if (url.indexOf(provider.endpoint) >= 0){
                    result = provider;
                    var otherFilesReg = /\.(gif|jpg|png|js|htm|woff|html|php|css)/i;
                    if (url.match(otherFilesReg)){
                        result = null;
                    }
                }

                if (result){
                    return false;
                }
			}
		});
        localStorage.lastResult = result;
		return result;
	}

	chrome.devtools.panels.create("REST Sniffer", "images/logo32.png", "panel.html",
			function(panel) {
				panel.onShown.addListener(function(window) {
					panelWindow = window;
					window.setProviders(providers);
					while (que.length > 0) {
						var event = que.pop();
						panelWindow.add(event.filtered, event.request, event.content);
					}
				});
			});

	chrome.devtools.network.onRequestFinished.addListener(function(request) {
		var filtered = isRestRequest(request.request.url);
		if (filtered) {
			request.getContent(function(content) {
				if (typeof panelWindow === "undefined") {
					que.push({
						filtered : filtered,
						request : request,
						content : content
					});
				} else {
					panelWindow.add(filtered, request, content);
				}
			});
		}
	});

})(jQuery);

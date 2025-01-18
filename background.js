if (!localStorage["cloud_input_on"]) {
	localStorage["cloud_input_on"] = JSON.stringify(false);
}

function turnOn(tabId) {
	//console.log("Turn On");
  	chrome.tabs.sendMessage(tabId, {action: "on"});
	chrome.browserAction.setBadgeText({text: "ON "});
}

function turnOff(tabId) {
	//console.log("Turn Off");
	chrome.tabs.sendMessage(tabId, {action: "off"});
	chrome.browserAction.setBadgeText({text: "OFF"});
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		if (tab && tab.url && tab.status == "complete") {
			if (JSON.parse(localStorage["cloud_input_on"])) {
				turnOn(tab.id);
			} else {
				turnOff(tab.id);
			}
		}
	});
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	//console.log(changeInfo.url + " updated with status " + changeInfo.status);
	if (changeInfo.status == "complete") {
		if (JSON.parse(localStorage["cloud_input_on"])) {
			turnOn(tabId);
		} else {
			turnOff(tabId);
		}
	}
});


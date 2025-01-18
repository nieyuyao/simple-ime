function turnOn() {
	//console.log("Turn On");
	chrome.tabs.getSelected(null, function(tab) {
  		chrome.tabs.sendMessage(tab.id, {action: "on"});
	});
	chrome.browserAction.setBadgeText({text: "ON "});
}

function turnOff() {
	//console.log("Turn Off");
	chrome.tabs.getSelected(null, function(tab) {
  		chrome.tabs.sendMessage(tab.id, {action: "off"});
	});
	chrome.browserAction.setBadgeText({text: "OFF"});
}

document.getElementById("turn_on").addEventListener("click", function(e){
	e.preventDefault();
	turnOn();
	localStorage["cloud_input_on"] = JSON.stringify(true);
}, false)

document.getElementById("turn_off").addEventListener("click", function(e){
	e.preventDefault();
	turnOff();
	localStorage["cloud_input_on"] = JSON.stringify(false);
}, false)

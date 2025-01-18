import '../src/cloud_input'


function cloud_input_dirname(path) {
  return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
}
function cloud_input_load() {
  var cloud_input_init_loc = "";
  var cloud_input_static = cloud_input_dirname(cloud_input_init_loc) + "/";
  if (!document.getElementById("cloud_input_1.0")) {
      CloudInput.init.call(CloudInput, cloud_input_static);
      CloudInput.turnOn.call(CloudInput);
  } else {
    CloudInput.toggleOnOff();
  }
}

window.CloudInput.init()
window.CloudInput.turnOn()
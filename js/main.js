var app = angular.module('PcControllApp', []);

var MPC_COMMAND = {
	PLAY_PAUSE : 889,
	BACKWARD_MEDIUM: 901,
	FORWARD_MEDIUM: 902,
	NEXT_TRACK: 922,
	PREVIOUS_TRACK: 921,
	MUTE: 909,
	VOL_UP: 907,
	VOL_DOWN: 908
}

var TVKEY = {
	UP : 38,
	DOWN: 40,
	LEFT: 37,
	RIGHT: 39,
	OK : 13,
	BACK: 10009,
	MEDIA_PLAY : 415,
	MEDIA_PAUSE : 19,
	MEDIA_REWIND: 412,
	MEDIA_FAST_FORWARD: 417,
	MEDIA_TRACK_PREVIOUS: 10232,
	MEDIA_TRACK_NEXT: 10233,
	VOLUME_UP: 447,
	VOLUME_DOWN: 448,
	VOLUME_MUTE: 449,
	ZERO: 48,
	ONE: 49,
	TWO: 50,
	THREE: 51,
	FOUR: 52,
	FIVE: 53,
	SIX: 54,
	SEVEN: 55,
	EIGHT: 56,
	NINE: 57
}

var MODE = {
	NORMAL : 0,
	OPT : 1
}

var TVKEY_TO_MPC_COMMAND = {};
TVKEY_TO_MPC_COMMAND[TVKEY.MEDIA_PLAY] = MPC_COMMAND.PLAY_PAUSE;
TVKEY_TO_MPC_COMMAND[TVKEY.MEDIA_PAUSE] = MPC_COMMAND.PLAY_PAUSE;
TVKEY_TO_MPC_COMMAND[TVKEY.MEDIA_REWIND] = MPC_COMMAND.BACKWARD_MEDIUM;
TVKEY_TO_MPC_COMMAND[TVKEY.MEDIA_FAST_FORWARD] = MPC_COMMAND.FORWARD_MEDIUM;
TVKEY_TO_MPC_COMMAND[TVKEY.MEDIA_TRACK_NEXT] = MPC_COMMAND.NEXT_TRACK;
TVKEY_TO_MPC_COMMAND[TVKEY.MEDIA_TRACK_PREVIOUS] = MPC_COMMAND.PREVIOUS_TRACK;

TVKEY_TO_MPC_COMMAND[TVKEY.VOLUME_UP] = MPC_COMMAND.VOL_UP;
TVKEY_TO_MPC_COMMAND[TVKEY.VOLUME_DOWN] = MPC_COMMAND.VOL_DOWN;
TVKEY_TO_MPC_COMMAND[TVKEY.VOLUME_MUTE] = MPC_COMMAND.MUTE;


var address = "http://192.168.0.13:13579/command.html"  


app.controller('MainController', ['$scope', '$http', function MainController($scope, $http) {
	var mode = MODE.NORMAL;
	$scope.ipAddress = '192.168.0.13:13579';
	
	function init(){
		console.log(tizen.tvinputdevice.getSupportedKeys());
		tizen.tvinputdevice.registerKeyBatch(['MediaPlay', 'MediaPause', 'MediaRewind', 'MediaFastForward', 
		                                      'MediaTrackPrevious', 'MediaTrackNext', 'VolumeUp', 'VolumeDown', 'VolumeMute',
		                                      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
		document.addEventListener("keydown", keyDownEventListener);
		showPiPFull();
	}
	
	function callMpcCommand(keycode){
		var commandCode = TVKEY_TO_MPC_COMMAND[keycode];
		if(!commandCode){
			console.log("Unrecognized command for key: " + keyCode);
		} else {
			$http({
				method: "GET",
				url: address + "?wm_command=" + commandCode
			});
		}
	}
	
	function keyDownEventListener(e){
		console.log(e.keyCode);
		var keyCode = e.keyCode;
		switch (keyCode) {
			case TVKEY.BACK:
				if(isMode(MODE.NORMAL)){
					try {
			            tizen.application.getCurrentApplication().exit();
			        } catch (error) {
			            console.error("getCurrentApplication(): " + error.message);
			        }
				} else if(isMode(MODE.OPT)){
					switchMode(MODE.NORMAL);
					showPiPFull();
				}
				break;
			case TVKEY.OK:
				if(isMode(MODE.NORMAL)){
					switchMode(MODE.OPT);
					showPiPOpt();
				}
				break;
			default:
				callMpcCommand(keyCode)
				break;
		}
	}
	
	function isMode(toCheck){
		return mode == toCheck;
	}
	
	function switchMode(newMode){
		mode = newMode;
	}
	
	function showPiPOpt(){
		showPiP('15%', '0', '70%', '70%');
	}
	
	function showPiPFull(){
		showPiP('0', '0', '100%', '100%');
	}
	
	function showPiP(x, y, width, height){
		tizen.tvwindow.show(
		  function(success){
		    console.log('showPiP success');
		  },
		  function(fail){
		    console.log('showPiP fail');
		  },
		  [x, y, width, height],
		  'MAIN'
		);
	}
	
	init();
}]);



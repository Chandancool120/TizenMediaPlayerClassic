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

var IP_ADDR_LOCAL_STORAGE_KEY = "IP_ADDR";

app.controller('MainController', ['$scope', '$http', '$interval', function MainController($scope, $http, $interval) {
	var mode = MODE.NORMAL;
	
	function init(){
		var savedIpAddr = localStorage.getItem(IP_ADDR_LOCAL_STORAGE_KEY);
		$scope.ipAddressInput = {val: savedIpAddr ? savedIpAddr : '192.168.0.13:13579'};
		$scope.ipAddress = $scope.ipAddressInput.val;
		$scope.progressInfo = "";
		$scope.filename = "";
		$scope.remaining = "";
		
		console.log(tizen.tvinputdevice.getSupportedKeys());
		tizen.tvinputdevice.registerKeyBatch(['MediaPlay', 'MediaPause', 'MediaRewind', 'MediaFastForward', 
		                                      'MediaTrackPrevious', 'MediaTrackNext', 'VolumeUp', 'VolumeDown', 'VolumeMute',
		                                      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
		document.addEventListener("keydown", keyDownEventListener);
		
		showPiPFull();
		startClock();
	}
	
	function callMpcCommand(keycode){
		var commandCode = TVKEY_TO_MPC_COMMAND[keycode];
		if(!commandCode){
			console.log("Unrecognized command for key: " + keyCode);
		} else {
			$http({
				method: "GET",
				url: "http://" + $scope.ipAddress + "/command.html?wm_command=" + commandCode
			});
		}
	}
	
	function startClock(){
	  var tick = function() {
	    $scope.clock = Date.now();
	  }
	  tick();
	  $interval(tick, 1000);
	}
	
	function keyDownEventListener(e){
		console.log(e.keyCode);
		var keyCode = e.keyCode;
		
		if(isMode(MODE.NORMAL)){
			switch (keyCode) {
				case TVKEY.BACK:
					try {
			            tizen.application.getCurrentApplication().exit();
			        } catch (error) {
			            console.error("getCurrentApplication(): " + error.message);
			        }
					break;
				case TVKEY.OK:
					switchMode(MODE.OPT);
					showOptView();
					break;
				default:
					callMpcCommand(keyCode)
					break;
			}
		}
		
		if(isMode(MODE.OPT)){
			switch (keyCode) {
				case TVKEY.BACK:
					$scope.ipAddressInput.val = $scope.ipAddress;
					switchMode(MODE.NORMAL);
					showPiPFull();
					break;
				case TVKEY.OK:
					$scope.ipAddress = $scope.ipAddressInput.val;
					localStorage.setItem(IP_ADDR_LOCAL_STORAGE_KEY, $scope.ipAddress);
					break;
				case TVKEY.LEFT:
					if($scope.ipAddressInput.val.length > 0){
						$scope.ipAddressInput.val = $scope.ipAddressInput.val.slice(0, -1);
					}
					break;
				case TVKEY.RIGHT:
					$scope.ipAddressInput.val = "";
					break;
				case TVKEY.UP:
					$scope.ipAddressInput.val += ":";
					break;
				case TVKEY.DOWN:
					$scope.ipAddressInput.val += ".";
					break;
				case TVKEY.ZERO:
					$scope.ipAddressInput.val += "0";
					break;
				case TVKEY.ONE:
					$scope.ipAddressInput.val += "1";
					break;
				case TVKEY.TWO:
					$scope.ipAddressInput.val += "2";
					break;
				case TVKEY.THREE:
					$scope.ipAddressInput.val += "3";
					break;
				case TVKEY.FOUR: 
					$scope.ipAddressInput.val += "4";
					break;
				case TVKEY.FIVE: 
					$scope.ipAddressInput.val += "5";
					break;
				case TVKEY.SIX: 
					$scope.ipAddressInput.val += "6";
					break;
				case TVKEY.SEVEN: 
					$scope.ipAddressInput.val += "7";
					break;
				case TVKEY.EIGHT:
					$scope.ipAddressInput.val += "8";
					break;
				case TVKEY.NINE: 
					$scope.ipAddressInput.val += "9";
					break;
				default:
					break;
			}	
			console.log($scope.ipAddressInput.val);
			$scope.$apply();
		}
		
		
	}
	
	function isMode(toCheck){
		return mode == toCheck;
	}
	
	function switchMode(newMode){
		mode = newMode;
	}
	
	function showOptView(){
		updateProgressInfo();
		showPiP('15%', '0', '70%', '70%');
	}
	
	function updateProgressInfo(){
		$scope.progressInfo = "";
		$scope.filename = "";
		$scope.remaining = "";
		$http({
			method: "GET",
			url: "http://" + $scope.ipAddress + "/variables.html"
		}).then(function success(response){
			var data = response.data;
			$scope.filename = extractVariable(data, "file");
			
			var position = extractVariable(data, "positionstring");
			var duration = extractVariable(data, "durationstring");
			$scope.progressInfo = position + "/" + duration;
			
			var positionDate = new Date("01/01/2007 " + position);
			var durationDate = new Date("01/01/2007 " + duration);

			$scope.remaining = pad2((durationDate.getHours() - positionDate.getHours())) + ":" 
				+ pad2((durationDate.getMinutes() - positionDate.getMinutes())) + ":" 
				+ pad2((durationDate.getSeconds() - positionDate.getSeconds()))
		});
	}
	
	function extractVariable(variablesResponse, variable){
		var regex = new RegExp('(<p id="' + variable +  '">)(.*)(<\/p>)');
		var match = regex.exec(variablesResponse);
		return match[2];
	}
	
	function pad2(number) {
	     return (number < 10 ? '0' : '') + number
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



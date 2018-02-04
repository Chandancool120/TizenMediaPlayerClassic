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

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.timeout = 500;
}])

app.controller('ClockController', ['$scope', '$interval', function($scope, $interval){
	function init(){
		startClock();
	}
	
	function startClock(){
	  var tick = function() {
	    $scope.clock = Date.now();
	  }
	  tick();
	  $interval(tick, 1000);
	}
	
	init();
}]);

app.controller('InfoController', ['$scope', function($scope){
	function init(){
		console.log()
		$scope.$parent.$watch('variables', function(variables){
			updateInfo(variables);
		})
	}
	
	function updateInfo(variables){
		clearInfo();
		if(variables){
			$scope.filename = extractVariable(variables, "file");
			
			var position = extractVariable(variables, "positionstring");
			var duration = extractVariable(variables, "durationstring");
			$scope.progressInfo = position + "/" + duration;
			$scope.remaining = HHmmssDiff(position, duration);
		}
	}
	
	function extractVariable(variables, variable){
		var regex = new RegExp('(<p id="' + variable +  '">)(.*)(<\/p>)');
		var match = regex.exec(variables);
		return match[2];
	}
	
	function HHmmssDiff(h1String, h2String){
		var d1 = new Date("01/01/2007 " + h1String);
		var d2 = new Date("01/01/2007 " + h2String);
		if(d1 > d2){
	  	var tmp = d1;
	    d1 = d2;
	    d2 = tmp;
	  }
	  
	  var secsDiff = timeDiff(d1.getSeconds(), d2.getSeconds(), 0);
	  var minsDiff = timeDiff(d1.getMinutes(), d2.getMinutes(), secsDiff[1]);
	  var hoursDiff = timeDiff(d1.getHours(), d2.getHours(), minsDiff[1]);
	  
	  return hoursDiff[0] + ':' + minsDiff[0] + ':' + secsDiff[0];
	}

	function timeDiff(t1, t2, reminder){
	  var diff = t2 - t1 + reminder;
	  var newReminder = 0;
	  if(diff < 0){
	  	diff = diff + 60;
	    newReminder = -1;
	  }
	  if(diff < 10){
	  	diff = (diff < 10 ? '0' : '') + diff;
	  }
	  var result = [diff, newReminder];
	  return result;
	}
	
	function clearInfo(){
		$scope.progressInfo = "";
		$scope.filename = "";
		$scope.remaining = "";
	}
	
	init();
	
}]);

app.controller('MainController', ['$scope', '$http', '$interval', function MainController($scope, $http, $interval) {
	$scope.mode = MODE.NORMAL;
	
	function init(){
		var savedIpAddr = localStorage.getItem(IP_ADDR_LOCAL_STORAGE_KEY);
		$scope.ipAddressInput = {val: savedIpAddr ? savedIpAddr : '192.168.0.13:13579'};
		$scope.ipAddress = $scope.ipAddressInput.val;
		$scope.variables = "";
		
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
				url: "http://" + $scope.ipAddress + "/command.html?wm_command=" + commandCode
			});
		}
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
				case TVKEY.ONE:
				case TVKEY.TWO:
				case TVKEY.THREE:
				case TVKEY.FOUR: 
				case TVKEY.FIVE: 
				case TVKEY.SIX: 
				case TVKEY.SEVEN: 
				case TVKEY.EIGHT:
				case TVKEY.NINE: 
					$scope.ipAddressInput.val += (keyCode - 2);
					break;
				default:
					callMpcCommand(keyCode)
					break;
			}	
			console.log($scope.ipAddressInput.val);
			$scope.$apply();
		}
		
		
	}
	
	function isMode(toCheck){
		return $scope.mode == toCheck;
	}
	
	function switchMode(newMode){
		$scope.mode = newMode;
	}
	
	function showOptView(){
		updateVariables();
		showPiP('15%', '0', '70%', '70%');
	}
	
	function updateVariables(){
		$scope.variables = "";
		$http({
			method: "GET",
			url: "http://" + $scope.ipAddress + "/variables.html",
			timeout: 500
		}).then(function success(response){
			$scope.variables = response.data;
		}, function error(response){
			
		});
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



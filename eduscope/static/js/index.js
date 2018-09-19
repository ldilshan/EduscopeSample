




var eduscope = angular.module('eduscope', ['FBAngular']);
eduscope.controller('buttonController', function($scope,$window, Fullscreen){
   

    $scope.stopVisble = false;
    $scope.callVisible = true;

    $scope.goFullscreen = function () {

        if (Fullscreen.isEnabled())
           Fullscreen.cancel();
        else
           Fullscreen.all();  
     };


    var ws = new WebSocket('wss://' + location.host + '/one2one');
    var videoInput;
    var videoOutput;
    var webRtcPeer;
    
    var registerName = null;
    const NOT_REGISTERED = 0;
    const REGISTERING = 1;
    const REGISTERED = 2;
    var registerState = null
    
    
    
    
    $scope.setRegisterState = function(nextState) {
        switch (nextState) {
        case NOT_REGISTERED:
            $('#register').attr('disabled', false);
            $('#call').attr('disabled', true);
            $('#terminate').attr('disabled', true);
            break;
    
        case REGISTERING:
            $('#register').attr('disabled', true);
            break;
    
        case REGISTERED:
            $('#register').attr('disabled', true);
            $scope.setCallState(NO_CALL);
            break;
    
        default:
            return;
        }
        registerState = nextState;
    }
    
    const NO_CALL = 0;
    const PROCESSING_CALL = 1;
    const IN_CALL = 2;
    var callState = null
    
    $scope.setCallState = function(nextState) {
        switch (nextState) {
        case NO_CALL:
            $('#call').attr('disabled', false);
            $('#terminate').attr('disabled', true);
            break;
    
        case PROCESSING_CALL:
            $('#call').attr('disabled', true);
            $('#terminate').attr('disabled', true);
            break;
        case IN_CALL:
            $('#call').attr('disabled', true);
            $('#terminate').attr('disabled', false);
            break;
        default:
            return;
        }
        callState = nextState;
    }
    
    // window.onload = function() {
    //     console = new Console();
    //         $scope.setRegisterState(NOT_REGISTERED);
    //         var drag = new Draggabilly(document.getElementById('videoSmall'));
    //         videoInput = document.getElementById('videoInput');
    //         videoOutput = document.getElementById('videoOutput');
    //         document.getElementById('name').focus();
    //         alert("hello");
    
    // }
    
   
    //     // document.getElementById('call').addEventListener('click', function() {
    //     // 	call();
    //     // });
    //     // document.getElementById('terminate').addEventListener('click', function() {
    //     // 	stop();
    //     // });
    // }

    $scope.onload = function(){
        // console = new Console();
        $scope.setRegisterState(NOT_REGISTERED);
        var drag = new Draggabilly(document.getElementById('videoSmall'));
         videoInput = document.getElementById('videoInput');
        // camVideo  = document.getElementById('camVideo');
         videoOutput = document.getElementById('videoOutput');
        document.getElementById('name').focus();
       

        // var modal = document.getElementById('myModal');
        // var span = document.getElementsByClassName("close")[0];
        // span.onclick = function() {
        //     modal.style.display = "none";
        // }
        // window.onclick = function(event) {
        //     if (event.target == modal) {
        //         modal.style.display = "none";
        //     }
        // }
    


    }
    
    window.onbeforeunload = function() {
        ws.close();
    }
    
    ws.onmessage = function(message) {
        var parsedMessage = JSON.parse(message.data);
        console.info('Received message: ' + message.data);
    
        switch (parsedMessage.id) {
        case 'registerResponse':
            $scope.resgisterResponse(parsedMessage);
            break;
        case 'callResponse':
        $scope.callResponse(parsedMessage);
            break;
        case 'incomingCall':
        $scope.incomingCall(parsedMessage);
            break;
        case 'startCommunication':
        $scope.startCommunication(parsedMessage);
            break;
        case 'stopCommunication':
            console.info("Communication ended by remote peer");
            $scope.stop(true);
            break;
        case 'iceCandidate':
            webRtcPeer.addIceCandidate(parsedMessage.candidate)
            break;
        default:
            console.error('Unrecognized message', parsedMessage);
        }
    }
    
   $scope.resgisterResponse = function(message) {
        if (message.response == 'accepted') {
            $scope.setRegisterState(REGISTERED);
        } else {
            $scope.setRegisterState(NOT_REGISTERED);
            var errorMessage = message.message ? message.message
                    : 'Unknown reason for register rejection.';
            console.log(errorMessage);
            alert('Error registering user. See console for further information.');
        }
    }
    
    $scope.callResponse = function(message) {
        if (message.response != 'accepted') {
            console.info('Call not accepted by peer. Closing call');
            var errorMessage = message.message ? message.message
                    : 'Unknown reason for call rejection.';
            console.log(errorMessage);
            $scope.stop(true);
        } else {
            $scope.setCallState(IN_CALL);
            webRtcPeer.processAnswer(message.sdpAnswer);
        }
    }
    
    $scope.startCommunication = function(message) {
        $scope.setCallState(IN_CALL);
        webRtcPeer.processAnswer(message.sdpAnswer);
    }
    
    $scope.incomingCall = function(message) {
        // If bussy just reject without disturbing user

        if (callState != NO_CALL) {
            var response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'bussy'
    
            };
            return $scope.sendMessage(response);
        }
    
        $scope.setCallState(PROCESSING_CALL);
        if (confirm('User ' + message.from + ' is calling you..')) {

           $scope.showSpinner(videoInput, videoOutput);
            
       
           var constraints = {
            audio : true,
            video :{
                width: 640,
                framerate : 15,
            }
    }

    var options = {
        localVideo : videoInput,
        remoteVideo : videoOutput,
        ocnicecandidate : onIceCandidate,
        mediaConstraints : constraints
    }
            
    
    
            webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options,
                    function(error) {
                        if (error) {
                            console.error(error);
                            $scope.setCallState(NO_CALL);
                        }
    
                        this.generateOffer(function(error, offerSdp) {
                            if (error) {
                                console.error(error);
                                $scope.setCallState(NO_CALL);
                            }
                            var response = {
                                id : 'incomingCallResponse',
                                from : message.from,
                                callResponse : 'accept',
                                sdpOffer : offerSdp
                            };
                            $scope.callVisible = false;
                         
                            $scope.sendMessage(response);
                        });
                    });
                    
        } else {
            var response = {
                id : 'incomingCallResponse',
                from : message.from,
                callResponse : 'reject',
                message : 'user declined'
            };
            $scope.sendMessage(response);
           $scope.stop(true);
        }
    }
    
   $scope.register = function() {
       
        
        var name = document.getElementById('name').value;
        if (name == '') {
            window.alert("Enter the  Name");
            return;
        }
    
       $scope.setRegisterState(REGISTERING);
    
        var message = {
            id : 'register',
            name : name
        };
        $scope.sendMessage(message);
        //document.getElementById('peer').focus();
    }
    
    $scope.call = function() {
        if (document.getElementById('peer').value == '') {
            window.alert("You must specify the peer name");
            return;
        }
    
        $scope.setCallState(PROCESSING_CALL);
        
        $scope.stopVisible = true;
        $scope.callVisible = false;
    

        
        $scope.showSpinner(videoInput, videoOutput);
        
        var constraints = {
                audio : true,
                video :{
                    width:640,
                    framerate : 15
                }
        }
    
        var options = {
            camVideo : videoInput,
            remoteVideo : videoOutput,
            onicecandidate : onIceCandidate,
            mediaonstraints : constraints
        }
    console.log("options",options);
        console.log("options",options.camVideo);
        webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(
                error) {
            if (error) {
                console.error(error);
               $scope.setCallState(NO_CALL);
            }
    
            this.generateOffer(function(error, offerSdp) {
                if (error) {
                    console.error(error);
                    $scope.setCallState(NO_CALL);
                }
                var message = {
                    id : 'call',
                    from : document.getElementById('name').value,
                    to : document.getElementById('peer').value,
                    sdpOffer : offerSdp
                };
                $scope.sendMessage(message);
            });
        });
    
    }
    
    $scope.stop = function(message) {


       // $scope.name="";
        $scope.callVisible = true;
        $scope.stopVisible = false;
        $scope.setCallState(NO_CALL);
        if (webRtcPeer) {
            webRtcPeer.dispose();
            webRtcPeer = null;
    
            if (!message) {
                var message = {
                    id : 'stop'
                }
               $scope.sendMessage(message);
            }
        }
        $scope.hideSpinner(videoInput, videoOutput);
    }
    console.log("you are");
    $scope.sendMessage = function(message) {

        var jsonMessage = JSON.stringify(message);
        console.log("Sending message: " + jsonMessage);
        console.log("hello world");
        ws.send(jsonMessage);
    }
    
    function onIceCandidate(candidate) {
        console.log('Local candidate' + JSON.stringify(candidate));
    
        var message = {
            id : 'onIceCandidate',
            candidate : candidate
        }
        $scope.sendMessage(message);
    }
    
    $scope.showSpinner = function() {
        for (var i = 0; i < arguments.length; i++) {
            arguments[i].poster = './img/transparent-1px.png';
            arguments[i].style.background = 'center transparent url("./img/spinner.gif") no-repeat';
        }
    }
    
    $scope.hideSpinner = function() {
        for (var i = 0; i < arguments.length; i++) {
            arguments[i].src = '';
            arguments[i].poster = './img/eye.png';
            arguments[i].style.background = '';
        }
    }
    
    $scope.mute = function(){

       var videoInput = document.getElementById("videoInput");
       var  videoOutput = document.getElementById("videoOutput");
       videoInput.muted = true;
       videoOutput.muted = true;
    }
        // $scope.setting = function(){
            
        //     modal.style.display = "block";
        // }

  
    
    // When the user clicks anywhere outside of the modal, close it
  
    

  
    $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
        event.preventDefault();
        $(this).ekkoLightbox();
    });
 
 
});



function getopts(args, opts)
{
    var result = opts.default || {};
    args.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) { result[$1] = $3; });

    return result;
};
var camVideo;

var args = getopts(location.search,
    {
        default:
            {
                ws_uri: 'ws://' + location.hostname + ':8888/kurento',
                ice_servers: undefined
            }
    });

if (args.ice_servers) {
    console.log("Use ICE servers: " + args.ice_servers);
    kurentoUtils.WebRtcPeer.prototype.server.iceServers = JSON.parse(args.ice_servers);
} else {
    console.log("Use freeice");
}

var pipeline;
var webCam;

function start() {
    // alert("ssss");
    // if(!address.value){
    //     window.alert("You must set the video source URL first");
    //     return;
    // }
    // address.disabled = true;
    showSpinner(camVideo);
    var options = {
        remoteVideo : camVideo
    };

    webCam = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
        function(error){
            if(error){
                return console.error(error);
            }
            console.log("one");
            webCam.generateOffer(onOffer);
            console.log("two");
            webCam.peerConnection.addEventListener('iceconnectionstatechange', function(event){
                if(webCam && webCam.peerConnection){
                    console.log("oniceconnectionstatechange -> " + webCam.peerConnection.iceConnectionState);
                    console.log('icegatheringstate -> ' + webCam.peerConnection.iceGatheringState);
                }
            });
        });
}
function camLoad(){
    alert("okok");
    // console = new Console('console', console);
    camVideo = document.getElementById('videoInput');
    //var address = document.getElementById('address');
    // //address.value = 'rtsp://192.168.8.101:8080/h264_ulaw.sdp';
    // var pipeline;
    // var webCam;
    start();
    //startButton = document.getElementById('start');
    //startButton.addEventListener('click', start);

    //stopButton = document.getElementById('stop');
    //stopButton.addEventListener('click', stop);
    //
    // function start() {
    //     if(!address.value){
    //         window.alert("You must set the video source URL first");
    //         return;
    //     }
    //     address.disabled = true;
    //     showSpinner(videoOutput);
    //     var options = {
    //         remoteVideo : videoOutput
    //     };
    //
    //     webCam = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
    //         function(error){
    //             if(error){
    //                 return console.error(error);
    //             }
    //             console.log("one");
    //             webCam.generateOffer(onOffer);
    //             console.log("two");
    //             webCam.peerConnection.addEventListener('iceconnectionstatechange', function(event){
    //                 if(webCam && webCam.peerConnection){
    //                     console.log("oniceconnectionstatechange -> " + webCam.peerConnection.iceConnectionState);
    //                     console.log('icegatheringstate -> ' + webCam.peerConnection.iceGatheringState);
    //                 }
    //             });
    //         });
    // function onOffer(error, sdpOffer){
    //     console.log("three");
    //     if(error) return onError(error);
    //
    //     kurentoClient(args.ws_uri, function(error, kurentoClient) {
    //         if(error) return onError(error);
    //
    //         kurentoClient.create("MediaPipeline", function(error, p) {
    //             if(error) return onError(error);
    //
    //             pipeline = p;
    //
    //             pipeline.create("PlayerEndpoint", {uri: 'rtsp://192.168.8.101:8080/h264_ulaw.sdp'}, function(error, player){
    //                 if(error) return onError(error);
    //
    //                 pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint){
    //                     if(error) return onError(error);
    //
    //                     setIceCandidateCallbacks(webRtcEndpoint, webCam, onError);
    //
    //                     webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
    //                         if(error) return onError(error);
    //
    //                         webRtcEndpoint.gatherCandidates(onError);
    //
    //                         webCam.processAnswer(sdpAnswer);
    //                     });
    //
    //                     player.connect(webRtcEndpoint, function(error){
    //                         if(error) return onError(error);
    //
    //                         console.log("PlayerEndpoint-->WebRtcEndpoint connection established");
    //
    //                         player.play(function(error){
    //                             if(error) return onError(error);
    //
    //                             console.log("Player playing ...");
    //                         });
    //                     });
    //                 });
    //             });
    //         });
    //     });
    // }
    //
    // function stop() {
    //     address.disabled = false;
    //     if (webCam) {
    //         webCam.dispose();
    //         webCam = null;
    //     }
    //     if(pipeline){
    //         pipeline.release();
    //         pipeline = null;
    //     }
    //     hideSpinner(camVideo);
    // }

};

function onOffer(error, sdpOffer){
    console.log("three");
    if(error) return onError(error);

    kurentoClient(args.ws_uri, function(error, kurentoClient) {
        if(error) return onError(error);

        kurentoClient.create("MediaPipeline", function(error, p) {
            if(error) return onError(error);

            pipeline = p;

            pipeline.create("PlayerEndpoint", {uri: 'rtsp://192.168.8.101:8080/h264_ulaw.sdp'}, function(error, player){
                if(error) return onError(error);

                pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint){
                    if(error) return onError(error);

                    setIceCandidateCallbacks(webRtcEndpoint, webCam, onError);

                    webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
                        if(error) return onError(error);

                        webRtcEndpoint.gatherCandidates(onError);

                        webCam.processAnswer(sdpAnswer);
                    });

                    player.connect(webRtcEndpoint, function(error){
                        if(error) return onError(error);

                        console.log("PlayerEndpoint-->WebRtcEndpoint connection established");

                        player.play(function(error){
                            if(error) return onError(error);

                            console.log("Player playing ...");
                        });
                    });
                });
            });
        });
    });
}

function stop() {
    address.disabled = false;
    if (webCam) {
        webCam.dispose();
        webCam = null;
    }
    if(pipeline){
        pipeline.release();
        pipeline = null;
    }
    hideSpinner(camVideo);
}

function setIceCandidateCallbacks(webRtcEndpoint, webCam, onError){
    console.log("four");
    webCam.on('icecandidate', function(candidate){
        console.log("Local icecandidate " + JSON.stringify(candidate));

        candidate = kurentoClient.register.complexTypes.IceCandidate(candidate);

        webRtcEndpoint.addIceCandidate(candidate, onError);

    });
    webRtcEndpoint.on('OnIceCandidate', function(event){
        var candidate = event.candidate;

        console.log("Remote icecandidate " + JSON.stringify(candidate));

        webCam.addIceCandidate(candidate, onError);
    });
}

function onError(error) {
    if(error)
    {
        console.error(error);
        stop();
    }
}

function showSpinner() {
    // for (var i = 0; i < arguments.length; i++) {
    //     arguments[i].poster = 'img/transparent-1px.png';
    //     arguments[i].style.background = "center transparent url('img/spinner.gif') no-repeat";
    // }
}

function hideSpinner() {
    // for (var i = 0; i < arguments.length; i++) {
    //     arguments[i].src = '';
    //     arguments[i].poster = 'img/webrtc.png';
    //     arguments[i].style.background = '';
    // }
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
// $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
//     console.log("five");
//     event.preventDefault();
//     $(this).ekkoLightbox();
// });
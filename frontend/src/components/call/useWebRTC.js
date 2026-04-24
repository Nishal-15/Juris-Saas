import { socket } from "../../socket";

export const peer = new RTCPeerConnection();

export function initCall(stream){
  stream.getTracks().forEach(t=>peer.addTrack(t,stream));

  peer.onicecandidate = e=>{
    if(e.candidate){
      socket.emit("ice-candidate",e.candidate);
    }
  };

  peer.ontrack = e=>{
    document.getElementById("remoteVideo").srcObject = e.streams[0];
  };
}

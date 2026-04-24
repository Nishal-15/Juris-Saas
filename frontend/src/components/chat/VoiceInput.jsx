const SpeechRecognition =
 window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceInput({onText}){
  const start=()=>{
    const rec=new SpeechRecognition();
    rec.onresult=e=>onText(e.results[0][0].transcript);
    rec.start();
  };
  return <button onClick={start}>🎤</button>;
}

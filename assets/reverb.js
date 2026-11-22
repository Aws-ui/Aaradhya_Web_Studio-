const byId=id=>document.getElementById(id);
const speed=byId("speed"),wet=byId("wet"),play=byId("play"),exportButton=byId("export"),state=byId("state");
let ctx,buffer,impulse,playing,tailTimer,revision=0,rendering=false;
function context(){return ctx??=new AudioContext();}
function stop(){
  clearTimeout(tailTimer);
  if(playing){playing.source.onended=null;try{playing.source.stop();}catch{}playing.nodes.forEach(n=>n.disconnect());playing=null;}
  play.textContent="Play preview";
}
function controls(){play.disabled=!buffer;exportButton.disabled=!buffer||rendering;}
function begin(){stop();buffer=null;byId("track").textContent="No track loaded";controls();return ++revision;}
function ready(sound,name){buffer=sound;byId("track").textContent=name+" · "+sound.duration.toFixed(1)+" s";state.textContent="Ready to preview or export.";controls();}
function response(){
  if(impulse)return impulse;
  const c=context();impulse=c.createBuffer(2,Math.ceil(c.sampleRate*2),c.sampleRate);
  for(let ch=0;ch<2;ch++){const data=impulse.getChannelData(ch);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)**3;}
  return impulse;
}
function graph(c,sound){
  const source=c.createBufferSource(),dry=c.createGain(),effect=c.createGain(),verb=c.createConvolver();
  source.buffer=sound;verb.buffer=response();source.playbackRate.value=Number(speed.value);
  dry.gain.value=1-Number(wet.value);effect.gain.value=Number(wet.value);
  source.connect(dry).connect(c.destination);source.connect(verb).connect(effect).connect(c.destination);
  return {source,dry,effect,nodes:[source,dry,effect,verb]};
}
byId("sample").onclick=()=>{
  begin();const rate=22050,sound=context().createBuffer(1,rate*4,rate),samples=sound.getChannelData(0);
  [261.63,329.63,392,523.25,392,329.63,293.66,392].forEach((hz,n)=>{
    for(let i=0;i<rate/2;i++){const t=i/rate;samples[n*rate/2+i]=.35*Math.sin(2*Math.PI*hz*t)*Math.min(1,t*90)*Math.exp(-7*t)*Math.min(1,(.5-t)*90);}
  });
  ready(sound,"Studio melody");
};
byId("file").onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const id=begin();
  try{if(file.size>25*1024*1024)throw Error("Please choose a file under 25 MB.");
    state.textContent="Reading audio…";const sound=await context().decodeAudioData(await file.arrayBuffer());if(id!==revision)return;
    if(sound.duration>180)throw Error("Please choose a clip up to 3 minutes long.");ready(sound,file.name);
  }catch(err){if(id===revision)state.textContent=err.name==="EncodingError"?"This audio format could not be opened. Try MP3 or WAV.":err.message;}
};
speed.oninput=()=>{byId("speedValue").value=Number(speed.value).toFixed(2)+"×";if(playing)playing.source.playbackRate.value=Number(speed.value);};
wet.oninput=()=>{byId("wetValue").value=Math.round(wet.value*100)+"%";if(playing){playing.dry.gain.value=1-wet.value;playing.effect.gain.value=Number(wet.value);}};
play.onclick=async()=>{
  if(playing){stop();state.textContent="Preview stopped.";return;}
  try{const id=revision;await context().resume();if(id!==revision||playing)return;playing=graph(ctx,buffer);playing.source.onended=()=>{tailTimer=setTimeout(()=>{stop();state.textContent="Preview finished.";},wet.value>0?2000:0);};playing.source.start();play.textContent="Stop preview";state.textContent="Playing preview.";}catch{stop();state.textContent="Playback could not start on this device.";}
};
function wav(sound){
  const channels=sound.numberOfChannels,bytes=sound.length*channels*2,view=new DataView(new ArrayBuffer(44+bytes));
  const label=(at,text)=>[...text].forEach((c,i)=>view.setUint8(at+i,c.charCodeAt(0)));
  label(0,"RIFF");view.setUint32(4,36+bytes,true);label(8,"WAVE");label(12,"fmt ");view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,sound.sampleRate,true);view.setUint32(28,sound.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);label(36,"data");view.setUint32(40,bytes,true);
  const data=Array.from({length:channels},(_,i)=>sound.getChannelData(i));let pos=44;
  for(let i=0;i<sound.length;i++)for(const ch of data){const n=Math.max(-1,Math.min(1,ch[i]));view.setInt16(pos,n*(n<0?32768:32767),true);pos+=2;}
  return new Blob([view.buffer],{type:"audio/wav"});
}
exportButton.onclick=async()=>{
  if(!buffer||rendering)return;const id=revision;rendering=true;controls();state.textContent="Rendering WAV…";
  try{const rate=context().sampleRate,c=new OfflineAudioContext(2,Math.ceil((buffer.duration/Number(speed.value)+(wet.value>0?2:0))*rate),rate);graph(c,buffer).source.start();const rendered=await c.startRendering();if(id!==revision)return;const url=URL.createObjectURL(wav(rendered)),a=document.createElement("a");a.href=url;a.download="songs-reverb-mix.wav";a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);state.textContent="WAV exported.";}
  catch{if(id===revision)state.textContent="Export failed. Try a shorter clip.";}finally{rendering=false;controls();}
};

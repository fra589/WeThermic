// Pour la fonction beep()
// if you have another AudioContext class use that one, as some browsers have a limit
var audioCont = new (window.AudioContext || window.webkitAudioContext || window.audioContext);

onmessage = function(e) {
  //console.log('Worker: Message received from main script');
  const result = e.data[0] * e.data[1];
  if (isNaN(result)) {
    postMessage('Please write two numbers');
  } else {
    const workerResult = 'Result: ' + result;
    //console.log('Worker: Posting message back to main script');
    postMessage(workerResult);
  }
}

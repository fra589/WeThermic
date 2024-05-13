
function isScreenLockSupported() {
 return ('wakeLock' in navigator);
}

async function getScreenLock() {
  if(isScreenLockSupported()){
    let screenLock;
    try {
       screenLock = await navigator.wakeLock.request('screen');
    } catch(err) {
       console.log(err.name, err.message);
    }
    return screenLock;
  }
}

function releaseScreenLock() { 
  if(typeof screenLock !== "undefined" && screenLock != null) {
    screenLock.release()
    .then(() => {
      console.log("Screen Lock released");
      screenLock = null;
    });
  }
}

if(isScreenLockSupported()){
  document.addEventListener('visibilitychange', async () => {
    if (screenLock !== null && document.visibilityState === 'visible') {
      screenLock = await navigator.wakeLock.request('screen');
    }
  });
}


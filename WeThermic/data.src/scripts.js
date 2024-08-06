/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: script.js is part of WeThermic                                */
/*                                                                          */
/* WeThermic is free software: you can redistribute it and/or modify it     */
/* under the terms of the GNU General Public License as published by        */
/* the Free Software Foundation, either version 3 of the License, or        */
/* (at your option) any later version.                                      */
/*                                                                          */
/* WeThermic is distributed in the hope that it will be useful, but         */
/* WITHOUT ANY WARRANTY; without even the implied warranty of               */
/* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the            */
/* GNU General Public License for more details.                             */
/*                                                                          */
/* You should have received a copy of the GNU General Public License        */
/* along with this program.  If not, see <http://www.gnu.org/licenses/>.    */
/*                                                                          */
/****************************************************************************/

//------------------------------------------------------------------------------------------
// Paramètres par défaut, peuvent être stockés dans le localStorage (preférences utilisateur)
//------------------------------------------------------------------------------------------

//style par défaut
const cssClair  = 'style_theme_clair.css';
const cssSombre = 'style_theme_sombre.css';
var cssFile = cssClair;
var linkClair = null;
var linkSombre = null;

// Durée de calcul des moyennes
var largeurMoyVent  = 180; // Moyenne sur 1 minute 30s
var largeurMoyPres  = 180; // Moyenne sur 1 minute 30s
var largeurMoyTemp  = 180; // Moyenne sur 1 minute 30s
// Interval & duree de esure
var interval = 500;        // 5 minutes tous les 500 ms
// Autre
var soundOn       = true;

//------------------------------------------------------------------------------------------

// pour debug du developpement, adresse IP de la Wemos connectée au wifi
//var netDevURL = 'http://10.10.10.10'; // connected to WeThermic
//var netDevURL = 'http://192.168.1.107'; // domopassaduy GB1
var netDevURL = 'http://192.168.1.80'; // domopassaduy GB2
//var netDevURL = 'http://192.168.1.130';  // BlancheNeige
//var netDevURL = 'http://192.168.1.60';  // La Gouffrerie
//var netDevURL = 'http://192.168.8.111'; // Cohabit

var couleurGrid = 'rgb(192, 192, 192)';
// Couleurs par defaut du theme clair
var couleurVent = 'rgb(0, 0, 255)';
var couleurFillVent = 'rgba(0, 0, 255, 0.2)';
var couleurMoyVent = 'rgb(0, 0, 127)';
var couleurPression = 'rgb(0, 255, 0)';
var couleurFillPression = 'rgba(0, 255, 0, 0.2)';
var couleurMoyPres = 'rgb(0, 127, 0)';
var couleurTempCtn = 'rgb(255, 0, 0)';
var couleurFillCtn = 'rgba(255, 0, 0, 0.2)';
var couleurMoyCtn = 'rgb(127, 0, 0)';


var histVentData    = new Array();
var histVentMoy     = new Array();
var vent            = 0.0;
var histPression    = new Array();
var histPresMoy     = new Array();
var pression        = 0.0;
var histTempCtn     = new Array();
var histTCtnMoy     = new Array();
var tempctn         = 0.0;


tblVents            = new Array(largeurMoyVent);
var tblVentsIdx     = 0;
var largeurVentFull = false;
var ventTotal       = 0.0;
var ventMoyen       = 0.0;

tblPres            = new Array(largeurMoyPres);
var tblPresIdx     = 0;
var largeurPresFull = false;
var presTotal       = 0.0;
var presMoyen       = 0.0;

var largDouxPres    = 8;
tblPresDoux         = new Array(largDouxPres);
var tblPresDouxIdx  = 0;
var tblPresFull     = false;
var presDouxTotal   = 0.0;

var tblTempIdx      = 0;
var largeurTempFull = false;
tblCtn              = new Array(largeurMoyTemp);
var ctnTotal        = 0.0;
var ctnMoyen        = 0.0;

var isFullScreen    = false;
var apConfigChange  = false;
var attenteOK       = false;
var chronoVisible   = false;
var chronoRunning   = false;
var chronoMaxTime   = 420; // 7 minutes = 7x60 secondes
var chronoDebut     = 0;
var chronoSepar     = ':';
var flagBeep = false;
var historiqueEnCours = false;
var refreshTimeoutID = 0;
var theme    = 'clair';
var newColor = 'rgb(0, 0, 0)';
var colorEnCours = "";

//             Do       Ré       Mi       Fa       Sol      La       Si       Do
const notes = [261.625, 293.664, 329.627, 349.228, 391.995, 440.000, 493.883, 523.251];
// Pour la fonction beep()
// if you have another AudioContext class use that one, as some browsers have a limit
var audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext);

function index_resize() {
  // Redimentionnement des graphiques en fonction de la page
  height = window.innerHeight;
  width  = window.innerWidth;
  document.getElementById("lapage").style.height = height + "px";
  document.getElementById("lapage").style.width = width + "px";
}

async function index_onload() {

  // Restauration des préférences avec l'API localStorage plutôt que des cookies
  var cssPref = localStorage.getItem("cssFile");
  if (cssPref !== null) {
    cssFile = cssPref;
  }
  if (cssFile == 'style_theme_sombre.css') {
    document.getElementById("sombre").checked = true;
    theme    = 'sombre';
  } else {
    document.getElementById("clair").checked = true;
    theme    = 'clair';
  }
  loadTheme();
  getThemeColor(theme);
  
  // Durée de calcul des moyennes par défaut ou celui défini dans le localStorage 
  var moyPref = localStorage.getItem("largeurMoyVent");
  if (moyPref !== null) {
    largeurMoyVent = Number(moyPref);
  }
  var moyPref = localStorage.getItem("largeurMoyPres");
  if (moyPref !== null) {
    largeurMoyPres = Number(moyPref);
  }
  moyPref = localStorage.getItem("largeurMoyTemp");
  if (moyPref !== null) {
    largeurMoyTemp = Number(moyPref);
  }
  document.getElementById("lMoyVent").value = largeurMoyVent / 60;
  inputLargeurVent();
  document.getElementById("lMoyPres").value = largeurMoyPres / 60;
  inputLargeurPres();
  document.getElementById("lMoyTemp").value = largeurMoyTemp / 60;
  inputLargeurTemp();

  var soundPref = localStorage.getItem("sound");
  if (soundPref !== null) {
    soundOn = soundPref === "true";
    // charge la bonne image du bouton
    const bouton = document.getElementById('boutonSon');
    if (soundOn) {
      bouton.src="images/sound-on.svg"
    } else {
      bouton.src="images/sound-off.svg"
    }
  }

  // Redimentionnement des graphiques en fonction de la dimension page
  index_resize();

  // Force le scrool en début de page
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "smooth",
  });
  
  // Mise à jour des infos de version
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/getversion");
  } else {
    XMLHttpRequest_get("/getversion");
  }

  // Récupère les valeurs historique
  // pour initialisation des graphiques.
  attenteOK  = false;
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/history");
  } else {
    XMLHttpRequest_get("/history");
  }
  while (!attenteOK) {
    await sleep(100);
  }
  attenteOK = false;

  yScaleWidth = 60;
  
  // vent
  var ventData = {
    datasets: [
      {
        cubicInterpolationMode: 'default',
        data: histVentData,
        fill: {
          target: 'origin',
          above: couleurFillVent,
          below: couleurFillVent
        },
        borderColor: couleurVent,
        borderWidth:2,
        order: 2,
        tension: 0.4
      },
      {
        cubicInterpolationMode: 'default',
        data: histVentMoy,
        fill: false,
        borderColor: couleurMoyVent,
        borderWidth:2,
        order: 1,
        tension: 0.4
      }
   ]
  };
  var ventOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    elements: {
      point:{
        radius: 0
      }
    },
    scales: {
      x: {
        type: 'realtime',
        realtime: {
          duration: interval * 600,
          refresh: interval,
          delay: 250,
          frameRate: 20,
          onRefresh: chart => {
            chart.data.datasets[0].data.push({
              x: Date.now(),
              y: vent
            });
            chart.data.datasets[1].data.push({
              x: Date.now(),
              y: ventMoyen
            });
          }
        },
        ticks: {
          display: false,
        },
        grid: {
          color: couleurGrid
        }
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        suggestedMax: 3,
        ticks: {
          color: couleurVent
        },
        grid: {
          color: couleurGrid
        },
        afterFit(scale) {
          scale.width = yScaleWidth;
        },
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Pression
  var presData = {
    datasets: [
      {
        cubicInterpolationMode: 'default',
        data: histPression,
        fill: {
          target: 'origin',
          above: couleurFillPression,
          below: couleurFillPression
        },
        borderColor: couleurPression,
        borderWidth:2,
        order: 5,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'default',
        data: histPresMoy,
        fill: false,
        borderColor: couleurMoyPres,
        borderWidth:3,
        order: 4,
        tension: 0.4,
        yAxisID: 'y'
      }
    ]
  };
  var presOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    elements: {
      point:{
        radius: 0
      }
    },
    scales: {
      x: {
        type: 'realtime',
        realtime: {
          duration: interval * 600,
          refresh: interval,
          delay: 250,
          frameRate: 20,
          onRefresh: chart => {
            chart.data.datasets[0].data.push({
              x: Date.now(),
              y: pression
            });              
            chart.data.datasets[1].data.push({
              x: Date.now(),
              y: presMoyen
            });              
          }
        },
        ticks: {
          display: false
        },
        grid: {
          color: couleurGrid
        }
      },
      y: {
        type: 'linear',
        beginAtZero: false,
        display: true,
        ticks: {
          color: couleurPression
        },
        grid: {
          color: couleurGrid
        },
        afterFit(scale) {
          scale.width = yScaleWidth;
        },
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Temperature
  var tempData = {
    datasets: [
      {
        cubicInterpolationMode: 'default',
        data: histTempCtn,
        fill: {
          target: 'origin',
          above: couleurFillCtn,
          below: couleurFillCtn
        },
        borderColor: couleurTempCtn,
        borderWidth:2,
        order: 1,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'default',
        data: histTCtnMoy,
        fill: false,
        borderColor: couleurMoyCtn,
        borderWidth:3,
        order: 2,
        tension: 0.4,
        yAxisID: 'y'
      },
    ]
  };
  var tempOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    elements: {
      point:{
        radius: 0
      }
    },
    scales: {
      x: {
        type: 'realtime',
        realtime: {
          duration: interval * 600,
          refresh: interval,
          delay: 250,
          frameRate: 50,
          onRefresh: chart => {
            chart.data.datasets[0].data.push({
              x: Date.now(),
              y: tempctn
            });
            chart.data.datasets[1].data.push({
              x: Date.now(),
              y: ctnMoyen
            });
          }
        },
        ticks: {
          display: true
        },
        grid: {
          color: couleurGrid
        }
      },
      y: {
        type: 'linear',
        beginAtZero: false,
        display: true,
        position:'left',
        ticks: {
          color: couleurTempCtn
        },
        grid: {
          color: couleurGrid
        },
        afterFit(scale) {
          scale.width = yScaleWidth;
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Création des graphiques
  Window.graphVent = new Chart(document.getElementById('graphVent'), {
    type: 'line',
    data: ventData,
    options: ventOptions
  });
  Window.graphPres = new Chart(document.getElementById('graphPres'), {
    type: 'line',
    data: presData,
    options: presOptions
  });
  Window.graphTemp = new Chart(document.getElementById('graphTemp'), {
    type: 'line',
    data: tempData,
    options: tempOptions
    //configTemp
  });

  // Applique le thème de couleurs
  appliqueTheme();

  // Récupération des valeurs temp réel (vent, température et pression)
  if (location.protocol == 'file:') {
    refreshTimeoutID = setTimeout(function() { XMLHttpRequest_get(netDevURL + "/getvalues") }, interval);
  } else {
    refreshTimeoutID = setTimeout(function() { XMLHttpRequest_get("/getvalues") }, interval);
  }

  // Masque l'animation d'attente
  var attente = document.getElementById("attente0")
  attente.classList.add("noshow");

  // récupère la config AP
  getAPconfig();

  /* A compléter...
   * cf. https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
   * cf. https://mdn.github.io/dom-examples/screen-wake-lock-api/
  // Blocage de la mise en veille - ne fonctionne qu'en HTTPS :-(
  if (location.protocol == 'https:') {
    getScreenLock();
  }
  */

} // index_onload()

function XMLHttpRequest_get(requette) {
  // Requette XML HTTP GET
  var heure = document.getElementById("heure");
  if (heure != null) {
    var now = new Date(Date.now());
    heure.textContent = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + "."+ now.getMilliseconds();
  }
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      if ((xhttp.status == 200) || (xhttp.status == 0)) {
        XMLHttpResult(requette, xhttp.responseXML, xhttp.responseText);
      } else {
        alert("XMLHttpRequest_get(" + requette + ") : Error " + xhttp.status);
      }
    }
  };
  xhttp.open("GET", requette, true);
  xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhttp.send();
}

function XMLHttpResult(requette, xml, text) {
  // Traitement de la réponse XML HTTP GET si existe...
  if (xml != null) {
    if ((requette == "/getversion") || (requette == netDevURL + "/getversion")) {
      var version_string = xml.getElementsByTagName("string")[0].childNodes[0].nodeValue;
      var doc_version = document.getElementById("version");
      doc_version.textContent = version_string;

    } else if ((requette == "/history") || (requette == netDevURL + "/history")) {
      graphHistoryintegration(xml);

    } else if ((requette == "/getvalues") || (requette == netDevURL + "/getvalues")) {
      if (!historiqueEnCours) {
        vent        = Number(xml.getElementsByTagName("v")[0].childNodes[0].nodeValue);
        calculMoyenneVent();

        var doc_vent  = document.getElementById("valeurVent");
        doc_vent.innerHTML    = '<span class="couleurVent">I = ' + Number.parseFloat(vent).toFixed(1).padStart(4, ' ') + 'm/s</span><br />';
        doc_vent.innerHTML   += '<span class="couleurMoyVent">A = ' + Number.parseFloat(ventMoyen).toFixed(1) + ' m/s</span>';

        var newCtn     = Number(xml.getElementsByTagName("c")[0].childNodes[0].nodeValue);
        if (Math.abs(newCtn - tempctn) < 3) {
          tempctn = newCtn;
        } else {
          tempctn = ctnMoyen;
        }
        calculMoyenneTemperature();

        var doc_temp = document.getElementById("valeurTemp");
        doc_temp.innerHTML    = ""
        doc_temp.innerHTML   += '<span class="couleurTempCtn">I = '    + Number.parseFloat(tempctn).toFixed(1) + '°C</span><br />';
        doc_temp.innerHTML   += '<span class="couleurMoyCtn">A = '      + Number.parseFloat(ctnMoyen).toFixed(1) + '°C</span>'

        pression    = calculPressionDouce(Number(xml.getElementsByTagName("p")[0].childNodes[0].nodeValue));
        calculMoyennePres();

        var doc_press = document.getElementById("valeurPress");
        doc_press.innerHTML  = '<span class="couleurPression">I = ' + Number.parseFloat(pression).toFixed(2) + "hPa</span><br :>";
        doc_press.innerHTML += '<span class="couleurMoyPres">A = ' + Number.parseFloat(presMoyen).toFixed(2) + "hPa</span>";
      }

    } else if ((requette == "/getnetworks") || (requette == netDevURL + "/getnetworks")) {
      // Rempli la liste des réseaux disponibles
      setNetworkList(xml);
      attenteOK = true;

    }  else if (requette == "/wificonnect") {
      result = xml.getElementsByTagName("result")[0].childNodes[0].nodeValue;
      if (result == "OK") {
        alert("Connexion OK.");
      } else {
        alert("Connexion error: \n" + result);
      }
    } else if ((requette == "/getapconfig") || (requette == netDevURL + "/getapconfig")) {
      var ssid       = xml.getElementsByTagName("ssid")[0].textContent;
      var pwd        = xml.getElementsByTagName("pwd")[0].textContent;
      var apSSID     = document.getElementById('apSSID');
      var apPwd1     = document.getElementById('apPwd1');
      var bottomSSID = document.getElementById('bottomSSID');
      apSSID.value   = ssid;
      apPwd1.value   = pwd;
      bottomSSID.textContent = ssid;
      apConfigChange = false;
      inputConfigAP();
    } else if ((requette.split('?')[0] == "/setduree") || (requette.split('?')[0] == netDevURL + "/setduree")) {
      result = xml.getElementsByTagName("result")[0].childNodes[0].nodeValue;
      if (result == "OK") {
        refreshPage();
        closeSettings();
      } else {
        alert(result);
      }
    }
  }

  if ((requette == "/getvalues") || (requette == netDevURL + "/getvalues")) {
    if (!historiqueEnCours) {
      // Appel recursif pour boucler au lieu d'utiliser  setInterval()
      // Cela assure que te traitement à été terminé avant de relancer
      // la requette vers le serveur web.
      autoRefresh();
    }
  }

}

function graphHistoryintegration(xml) {
  // Stop une demande de valeur planifiée
  clearTimeout(refreshTimeoutID);
  // flag pour éviter l'arrivée de valeurs en cours d'intégration en cas de refresh
  historiqueEnCours = true;
  // Intègre dynamiquement les données d'historique au graphiques
  var flagDebut = false;
  // Récupère la durée (500, 1000 ou 2000)
  interval = Number(xml.getElementsByTagName("d")[0].childNodes[0].nodeValue);
  // Met à jour la dialog de configuration en fonction de l'interval
  if (interval == 500) {
    document.getElementById("d500").checked = true;
  } else if (interval == 1000) {
    document.getElementById("d1000").checked = true;
  } else if (interval == 2000) {
    document.getElementById("d2000").checked = true;
  }
  // nombre de millisecondes écoulées depuis le premier janvier 1970
  tX = Date.now();
  // Il y a 5, 10 ou 20 minutes :
  tX = tX - ((interval / 100) * 60 * 1000) 
  hist = xml.getElementsByTagName("h");
  for (const h of hist) {
    pression   = calculPressionDouce(Number(h.getElementsByTagName("p")[0].childNodes[0].nodeValue));
    if (pression != 0) {
      // Donnée d'historique définie uniquement si pression != 0
      calculMoyennePres();
      vent       = Number(h.getElementsByTagName("v")[0].childNodes[0].nodeValue);
      calculMoyenneVent();
      var newCtn    = Number(h.getElementsByTagName("c")[0].childNodes[0].nodeValue);
      if (!(flagDebut)) {
        // C'est la première mesure de température
        tempctn = newCtn;
        ctnMoyen = newCtn;
        flagDebut = true;
      } else if (Math.abs(newCtn - tempctn) < 3) {
        // Température valide
        tempctn = newCtn;
      } else {
        // Elimination des points abérants, on les remplace par la valeur moyenne
        tempctn = ctnMoyen;
      }
      /*tempBmp180 = Number(h.getElementsByTagName("b")[0].childNodes[0].nodeValue);*/
      calculMoyenneTemperature();
      // Envoie les données d'historique dans les graphiques
      histVentData.push  ({x: tX, y: vent});
      histVentMoy.push   ({x: tX, y: ventMoyen});
      histTempCtn.push   ({x: tX, y: tempctn});
      histTCtnMoy.push   ({x: tX, y: ctnMoyen});
      histPression.push  ({x: tX, y: pression});
      histPresMoy.push   ({x: tX, y: presMoyen});
    }
    tX += interval // pas des mesures = interval : 500, 1000 ou 2000 ms
  }
  // Pour synchronisation XMLHttpRequest asynchrone
  attenteOK  = true;
  // On a fini, désactive le flag
  historiqueEnCours = false;
}

function autoRefresh() {
  // Appel recursif pour boucler au lieu d'utiliser  setInterval()
  // Cela assure que te traitement à été terminé avant de relancer
  // la requette vers le serveur web.
  if (location.protocol == 'file:') {
    refreshTimeoutID = setTimeout(function() { XMLHttpRequest_get(netDevURL + "/getvalues") }, interval);
  } else {
    refreshTimeoutID = setTimeout(function() { XMLHttpRequest_get("/getvalues") }, interval);
  }
}

function calculMoyenneVent() {

  // Remplace l'élément pointé par l'indexe et recalcul le total
  if (isNaN(tblVents[tblVentsIdx])) {
    // Initialise l'élément du tableau pour la première fois
    tblVents[tblVentsIdx] = 0
  }
  ventTotal = ventTotal - tblVents[tblVentsIdx];
  tblVents[tblVentsIdx] = vent;
  ventTotal = ventTotal + tblVents[tblVentsIdx];

  // Avance l'indexe du tableau
  tblVentsIdx = tblVentsIdx + 1;
  if (tblVentsIdx >= largeurMoyVent) {
    tblVentsIdx = 0;
    largeurVentFull = true;
  }

  if (largeurVentFull) {
    // calcul la moyenne sur l'ensemble du tableau
    ventMoyen = Math.round(ventTotal / largeurMoyVent * 10)/10;
  } else {
    // calcul la moyenne jusqu'à l'indexe (le tableau n'est pas complet).
    ventMoyen = Math.round(ventTotal / tblVentsIdx * 10)/10;
  }
}

function calculMoyennePres() {

  // Remplace l'élément pointé par l'indexe et recalcul le total
  if (isNaN(tblPres[tblPresIdx])) {
    // Initialise l'élément du tableau pour la première fois
    tblPres[tblPresIdx] = 0
  }
  presTotal = presTotal - tblPres[tblPresIdx];
  tblPres[tblPresIdx] = pression;
  presTotal = presTotal + tblPres[tblPresIdx];

  // Avance l'indexe du tableau
  tblPresIdx = tblPresIdx + 1;
  if (tblPresIdx >= largeurMoyVent) {
    tblPresIdx = 0;
    largeurPresFull = true;
  }

  if (largeurVentFull) {
    // calcul la moyenne sur l'ensemble du tableau
    presMoyen = Math.round(presTotal / largeurMoyVent * 100)/100;
  } else {
    presMoyen = Math.round(presTotal / tblPresIdx * 100)/100;
  }
  
}

function calculPressionDouce(pBrute) {
  // Calcul la moyenne glissante de la pression sur une faible largeur
  // pour adoussir la courbe et limiter les fluctuations et le ruit
  var presDouxMoyen   = 0.0;
  // Le calcul n'est fait que pour les pressions non nulles
  if (pBrute > 0) {
    // Remplace l'élément pointé par l'indexe et recalcul le total
    if (isNaN(tblPresDoux[tblPresDouxIdx])) {
      // Initialise l'élément du tableau pour la première fois
      tblPresDoux[tblPresDouxIdx] = 0
    }
    presDouxTotal = presDouxTotal - tblPresDoux[tblPresDouxIdx];
    tblPresDoux[tblPresDouxIdx] = pBrute;
    presDouxTotal = presDouxTotal + tblPresDoux[tblPresDouxIdx];
    // Avance l'indexe du tableau
    tblPresDouxIdx = tblPresDouxIdx + 1;
    if (tblPresDouxIdx >= largDouxPres) {
      tblPresDouxIdx = 0;
      tblPresFull = true;
    }
    if (tblPresFull) {
      // calcul la moyenne sur l'ensemble du tableau
      presDouxMoyen = presDouxTotal / largDouxPres;
    } else {
      presDouxMoyen = presDouxTotal / tblPresDouxIdx;
    }
    return presDouxMoyen;
  } else {
    return 0.0;
  }
}

function calculMoyenneTemperature() {

  // Remplace l'élément pointé par l'indexe et recalcul le total
  if (isNaN(tblCtn[tblTempIdx])) {
    // Initialise l'élément du tableau pour la première fois
    tblCtn[tblTempIdx] = 0;
  }
  ctnTotal   = ctnTotal   - tblCtn[tblTempIdx];
  tblCtn[tblTempIdx] = tempctn;
  ctnTotal = ctnTotal + tblCtn[tblTempIdx];

  // Avance l'indexe du tableau
  tblTempIdx = tblTempIdx + 1;
  if (tblTempIdx >= largeurMoyTemp) {
    tblTempIdx = 0;
    largeurTempFull = true;
  }

  if (largeurTempFull) {
    // calcul la moyenne sur l'ensemble du tableau
    ctnMoyen    = Math.round(ctnTotal / largeurMoyTemp * 100)/100;
  } else {
    // calcul la moyenne jusqu'à l'index (le tableau n'est pas complet).
    ctnMoyen    = Math.round(ctnTotal / tblTempIdx * 100)/100;
    //console.log("tblTempIdx=" + tblTempIdx + "   ctnTotal=" + Math.round(ctnTotal * 100)/100 + "   ctnMoyen=" + ctnMoyen)
  }
  
}

function changeSettings() {

  var dialog = document.getElementById("settingsDialog")
  dialog.classList.remove("noshow");

  var attente = document.getElementById("attente0")
  attente.classList.remove("noshow");

  // Met à jour le jeu de couleur
  resizeActiveColorTable();
  setMainDialogColor();
  
  // récupère la config AP
  getAPconfig();

  // Récupère la liste des réseaux disponibles
  get_networks();

}

function closeSettings() {
  var dialog = document.getElementById('settingsDialog')
  dialog.classList.add("noshow");
}

function loadTheme() {

  // Création des éléments link pour les 2 thèmes
  if (!document.getElementById(cssClair)) {
    linkClair      = document.createElement('link')
    linkClair.id   = cssClair;
    linkClair.rel  = 'stylesheet';
    linkClair.type = 'text/css';
    linkClair.href = cssClair;
  }
  if (!document.getElementById(cssSombre)) {
    linkSombre     = document.createElement('link')
    linkSombre.id   = cssSombre;
    linkSombre.rel  = 'stylesheet';
    linkSombre.type = 'text/css';
    linkSombre.href = cssSombre;
  }
  
  var head = document.getElementsByTagName('head')[0] ;
  if (cssFile == cssSombre)  { 
    head.append(linkSombre);
  } else {
    head.append(linkClair);
  }

}

function changeTheme(theTheme) {
  
  theme    = theTheme;
  var cssCharge = document.getElementById(cssFile);
  
  if ((theme == 'clair') && (cssFile == cssSombre)) {
    cssCharge.parentNode.replaceChild(linkClair, linkSombre);
    cssFile = cssClair;
  } else if ((theme == 'sombre') && (cssFile == cssClair)) {
    cssCharge.parentNode.replaceChild(linkSombre, linkClair);
    cssFile = cssSombre;
  }
  // Sauvegarde préférece
  localStorage.setItem("cssFile", cssFile);
  
  appliqueTheme();

}

function appliqueTheme() {
  
  setTimeout(() => {
    // setTimeout() pour laisser le temps de recharger le CSS
    // Reconfiguration des graphiques
    var cssParent = document.getElementById(cssFile).parentNode;
    var style = getComputedStyle(cssParent);
    // Couleurs par défaut du thème
    couleurGrid         = style.getPropertyValue('--couleurGrid');
    couleurVent         = style.getPropertyValue('--couleurVent');
    couleurFillVent     = getFillColor(couleurVent);
    couleurMoyVent      = style.getPropertyValue('--couleurMoyVent');
    couleurPression     = style.getPropertyValue('--couleurPression');
    couleurFillPression = getFillColor(couleurPression);
    couleurMoyPres      = style.getPropertyValue('--couleurMoyPres');
    couleurTempCtn      = style.getPropertyValue('--couleurTempCtn');
    couleurFillCtn      = getFillColor(couleurTempCtn);
    couleurMoyCtn       = style.getPropertyValue('--couleurMoyCtn');

    // Préférences de couleurs
    getThemeColor(theme);
    
    // Correction du CSS en fonction des préférences
    document.body.style.setProperty('--couleurVent', couleurVent);
    document.body.style.setProperty('--couleurMoyVent', couleurMoyVent);
    document.body.style.setProperty('--couleurPression', couleurPression);
    document.body.style.setProperty('--couleurMoyPres', couleurMoyPres);
    document.body.style.setProperty('--couleurTempCtn', couleurTempCtn);
    document.body.style.setProperty('--couleurMoyCtn', couleurMoyCtn);

    Window.graphVent.options.scales['x'].grid.color = couleurGrid;
    Window.graphVent.options.scales['y'].grid.color = couleurGrid;
    Window.graphVent.options.scales['y'].ticks.color = couleurVent;
    Window.graphVent.data.datasets[0].borderColor = couleurVent;
    Window.graphVent.data.datasets[0].fill.above = couleurFillVent;
    Window.graphVent.data.datasets[0].fill.below = couleurFillVent;
    Window.graphVent.data.datasets[1].borderColor = couleurMoyVent;
    
    Window.graphPres.options.scales['x'].grid.color = couleurGrid;
    Window.graphPres.options.scales['y'].grid.color = couleurGrid;
    Window.graphPres.options.scales['y'].ticks.color = couleurPression;
    Window.graphPres.data.datasets[0].borderColor = couleurPression;
    Window.graphPres.data.datasets[0].fill.above = couleurFillPression;
    Window.graphPres.data.datasets[0].fill.below = couleurFillPression;
    Window.graphPres.data.datasets[1].borderColor = couleurMoyPres;

    Window.graphTemp.options.scales['x'].grid.color = couleurGrid;
    Window.graphTemp.options.scales['y'].grid.color = couleurGrid;
    Window.graphTemp.options.scales['y'].ticks.color = couleurTempCtn;
    Window.graphTemp.data.datasets[0].borderColor = couleurTempCtn;
    Window.graphTemp.data.datasets[0].fill.above = couleurFillCtn;
    Window.graphTemp.data.datasets[0].fill.below = couleurFillCtn;
    Window.graphTemp.data.datasets[1].borderColor = couleurMoyCtn;

    setMainDialogColor();

  }, 500);
  
}

async function get_networks() {

  // Efface les données précédentes
  var divNetworkTable = document.getElementById("networkTable");
  divNetworkTable.innerHTML = "";
  var ssidActuel   = document.getElementById("ssidActuel");
  ssidActuel.value = "";
  var ipActuel     = document.getElementById("ipActuel");
  ipActuel.value   = "";

  // envoi la requette et attend la réponse
  attenteOK = false;
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/getnetworks");
  } else {
    XMLHttpRequest_get("/getnetworks");
  }
  while (!attenteOK) {
    await sleep(100);
  }
  attenteOK = false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setNetworkList(xml) {
  // Fonction appelée en retour de XMLHttpRequest_get("/getnetworks")
  var htmlNetworkTable = "";
  var tmpSSID      = "";
  var tmpChannel   = 0;
  var tmpRSSI      = "";
  var tmpCrypt     = "";
  var tmpPasswd    = "";
  var tmpImgSignal = "";
  
  var divNetworkTable = document.getElementById("networkTable");
  
  htmlNetworkTable += "  <table class=\"netTables\">\n";
  htmlNetworkTable += "    <thead>\n";
  htmlNetworkTable += "      <tr>\n";
  htmlNetworkTable += "        <th>&nbsp;</th>\n";
  htmlNetworkTable += "        <th>SSID</th>\n";
  htmlNetworkTable += "        <th>Channel</th>\n";
  htmlNetworkTable += "        <th>Security</th>\n";
  htmlNetworkTable += "      </tr>\n";
  htmlNetworkTable += "    </thead>\n";
  htmlNetworkTable += "    <tbody>\n";


  var netCurrent = xml.getElementsByTagName("activeNetwork")
  if (netCurrent.length == 1) {
    var ssidActuel   = document.getElementById("ssidActuel");
    currentSSID      = netCurrent[0].getElementsByTagName("SSID")[0].childNodes[0].nodeValue;
    ssidActuel.value = currentSSID;
    var ipActuel     = document.getElementById("ipActuel");
    currentIP        = netCurrent[0].getElementsByTagName("localip")[0].childNodes[0].nodeValue;
    ipActuel.value   = currentIP;
  }
  
  var netListe = xml.getElementsByTagName("network")
  if (netListe.length > 0) {
    for (var i = 0; i< netListe.length; i++) {
      // Données du réseau
      tmpSSID    = netListe[i].getElementsByTagName("SSID")[0].textContent;
      tmpChannel = netListe[i].getElementsByTagName("channel")[0].textContent;
      tmpRSSI    = netListe[i].getElementsByTagName("RSSI")[0].textContent;
      tmpCrypt   = netListe[i].getElementsByTagName("encryption")[0].textContent;
      tmpPasswd  = netListe[i].getElementsByTagName("knownPassword")[0].textContent;
      // Choix du pictogramme en fonction de la qualité du signal
      // RSSI (dBm) Interprétation
      // -30 dBm    Extraordinaire (êtes vous assis sur la borne? ^^)
      // -67 dBm    Très bon signal
      // -70 dBm    Très acceptable
      // -80 dBm   	as terrible du tout
      // -90 dBm    Inutilisable
      if (tmpRSSI <= -90) {
        tmpImgSignal = "images/signal0.svg";
      } else if ((tmpRSSI > -90) && (tmpRSSI <= -80)) {
        tmpImgSignal = "images/signal1.svg";
      } else if ((tmpRSSI > -80) && (tmpRSSI <= -70)) {
        tmpImgSignal = "images/signal2.svg";
      } else if ((tmpRSSI > -70) && (tmpRSSI <= -67)) {
        tmpImgSignal = "images/signal3.svg";
      } else if (tmpRSSI > -67) {
        tmpImgSignal = "images/signal4.svg";
      }
      htmlNetworkTable += "      <tr class=\"trlink\" onclick=\"wifi_connect('" + tmpSSID + "', '" + tmpChannel + "', '" + tmpPasswd.replace("'", "\\'") + "')\">\n";
      htmlNetworkTable += "        <td class=\"centreVertical\"><img src=\"" + tmpImgSignal + "\" title=\"RSSI = " + tmpRSSI + "\" /></td>\n";
      htmlNetworkTable += "        <td>" + tmpSSID + "</td>\n";
      htmlNetworkTable += "        <td>" + tmpChannel + "</td>\n";
      htmlNetworkTable += "        <td>" + tmpCrypt + "</td>\n";
      htmlNetworkTable += "      </tr>\n";
    }
  } else {
    htmlNetworkTable   += "      <tr>\n";
      htmlNetworkTable += "        <td colspan=\"4\">No network available</td>";
    htmlNetworkTable   += "      </tr>\n";
  }
  htmlNetworkTable += "    </tbody>\n";
  htmlNetworkTable += "  </table>\n";
  
  divNetworkTable.innerHTML = htmlNetworkTable;

  var attente = document.getElementById("attente0")
  attente.classList.add("noshow");

}

async function wifi_connect(SSID, channel, passwd) {

  var pwd = "";

  var ssid_input = document.getElementById("ssid_input");
  var pwd_input  = document.getElementById("pwd_input");
  var divWait    = document.getElementById("attente0");
  var btnConnect = document.getElementById("btnConnect");
  var btnAnnuler = document.getElementById("btnAnnuler");

  // Force le mode input masquée si une connexion précédente l'a modifié
  const bouton = document.getElementById('btnShowCliPasswd');
  var pwd_input = document.getElementById('pwd_input');
  if (pwd_input.type !== "password") {
    pwd_input.type = "password";
    bouton.src="images/oeuil.svg"
    bouton.title="Show password"
  }

  ssid_input.value = SSID + " (ch." + channel + ")";
  pwd_input.value  = passwd.replace("\\'", "'");
  connectOK = true;
  suiteOK = false;

  // Affiche la boite de dialogue de saisie du mot de passe réseau
  afficheDialog('dlgConnect');
  // Active les boutons de la boite de dialogue
  // (ils ont peut être été désactivé par une connexion précédente)
  btnConnect.disabled = false;
  btnAnnuler.disabled = false;
  // Donne le focus au champ de saisie du mot de passe
  pwd_input.focus();

  // Attente click sur bouton Connexion
  while (!suiteOK) {
    await sleep(100);
  }
  suiteOK = false;
  
  if (connectOK) {
    pwd = pwd_input.value;
    // Désactive les boutons de la boite de dialogue
    btnConnect.disabled = true;
    btnAnnuler.disabled = true;
    // Affiche l'annimation d'attente
    divWait.classList.remove("noshow");
    // Lance la connexion de la station
    //alert("XMLHttpRequest_post_wificonnect(" + SSID + ", " + pwd + ", " + channel + ");");
    XMLHttpRequest_post_wificonnect(SSID, pwd, channel);
    // On fermera la boite de dialogue et on masquera
    // l'animation d'attente dans 10 secondes
    setTimeout(function() { divWait.classList.add("noshow"); }, 10000);
    setTimeout(function() { closeDialog('dlgConnect'); }, 10000);
  } else {
    //alert("Canceled connection.");
    closeDialog('dlgConnect');
    btnConnect.disabled = false;
    btnAnnuler.disabled = false;
    pwd_input.value = "";
  }

}

function afficheDialog(dialog_id) {
  // Affiche la boite de dialogue
  var dlgMask = document.getElementById("dlgMask0");
  var dlgBox  = document.getElementById(dialog_id);
  
  dlgMask.classList.remove("noshow");
  window.setTimeout(function () {
    dlgBox.classList.remove("masquer");
  }, 0.2);
}

function closeDialog(dialog_id) {
  // Ferme la boite de dialogue
  var dlgMask = document.getElementById("dlgMask0");
  var dlgBox  = document.getElementById(dialog_id);
  dlgBox.classList.add("masquer");
  window.setTimeout(function () {
    dlgMask.classList.add("noshow");
  }, 1);
}

function connect_clique() {
  connectOK = true;
  suiteOK   = true;
  // Refresh wifi status
  get_networks();
}

function connect_cancel() {
  connectOK = false;
  suiteOK   = true;
}

function connect_keyup(e) {
  if (e.keyCode === 13) {
    document.getElementById("btnConnect").click();
  } else if (e.keyCode === 27) {
    document.getElementById("btnAnnuler").click();
  }
}

function XMLHttpRequest_post_wificonnect(SSID, pwd, channel) {
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4) {
      if ((xhttp.status == 200) || (xhttp.status == 0)) {
        XMLHttpResult("/wificonnect", xhttp.responseXML, xhttp.responseText);
      } else {
        alert("XMLHttpRequest_post_wificonnect() : Error " + xhttp.status);
      }
    }
  };

  var ssid_encode = encodeURIComponent(SSID);
  var pwd_encode  = encodeURIComponent(pwd);
  if (location.protocol == 'file:') {
    xhttp.open("POST", netDevURL + "/wificonnect", true);
  } else {
    xhttp.open("POST", "/wificonnect", true);
  }
  xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  xhttp.send("ssid=" + ssid_encode + "&pwd=" + pwd_encode + "&channel=" + channel);

}

function deconnect_clique() {
  var message = "";
  message = "Do you really want to disconnect from the current network\nand clear the client WiFi settings in the balance?";
  if (confirm(message)) {
    XMLHttpRequest_get("deconnexion");
  }
  // Refresh wifi status
  get_networks();
}

function refreshPage() {
  //location.reload();
  
  // Affiche l'animation d'attente
  var attente = document.getElementById("attente0")
  attente.classList.remove("noshow");

  // reinitialise les variables globales
  histVentData    = [];
  histVentMoy     = [];
  vent            = 0.0;
  histPression    = [];
  histPresMoy     = [];
  pression        = 0.0;
  histTempCtn     = [];
  histTCtnMoy     = [];
  tempctn         = 0.0;

  tblVents        = new Array(largeurMoyVent);
  tblVentsIdx     = 0;
  largeurVentFull = false;
  ventTotal       = 0.0;
  ventMoyen       = 0.0;

  tblPres         = new Array(largeurMoyPres);
  tblPresIdx      = 0;
  largeurPresFull = false;
  presTotal       = 0.0;
  presMoyen       = 0.0;

  largDouxPres    = 8;
  tblPresDoux     = new Array(largDouxPres);
  tblPresDouxIdx  = 0;
  tblPresFull     = false;
  presDouxTotal   = 0.0;

  tblTempIdx      = 0;
  largeurTempFull = false;
  tblCtn          = new Array(largeurMoyTemp);
  ctnTotal        = 0.0;
  ctnMoyen        = 0.0;

  // Supprime les graphiques
  Window.graphVent.destroy();
  Window.graphVent = null;
  Window.graphPres.destroy();
  Window.graphPres = null;
  Window.graphTemp.destroy();
  Window.graphTemp = null;
  
  // relance le script initial
  index_onload();
}

function toggleFullscreen() {
  //bouton = document.getElementById("fullScreenButton");
  if (!isFullScreen) {
    openFullscreen();
    //isFullScreen = true;
    //bouton.innerHTML = "<br />Close full screen<br />&nbsp;";
  } else {
    closeFullscreen();
    //isFullScreen = false;
    //bouton.innerHTML = "<br />View in full screen<br />&nbsp;";
  }
  window.scrollTo(0, 0);
}

/* View in fullscreen */
function openFullscreen() {
  var elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

function fullscreenchanged(event) {
  bouton = document.getElementById("fullScreenButton");
  // Redimentionnement des graphiques en fonction de la page
  height = window.innerHeight;
  width  = window.innerWidth;
  //alert(width + "\n" + height);
  document.getElementById("lapage").style.height = height + "px";
  document.getElementById("lapage").style.width = width + "px";
  if (document.fullscreenElement) {
    // Entrée en mode fullscreen
    isFullScreen = true;
    bouton.innerHTML = "<br />Close full screen<br />&nbsp;";
  } else {
    // Sortie fullscreen
    isFullScreen = false;
    bouton.innerHTML = "<br />View in full screen<br />&nbsp;";
  }
}
document.addEventListener("fullscreenchange", fullscreenchanged);

function inputLargeurVent() {
  // Affiche la largeur de calcul de la moyenne vent
  var lbl = document.getElementById("valMoyVent");
  var newVal = document.getElementById("lMoyVent").value;
  secondes = newVal * 30;
  lbl.innerText = new Date(secondes * 1000).toISOString().substring(15, 19);
}

function changeLargeurVent() {
  // Modifie la largeur de calcul de la moyenne vent
  var newVal = document.getElementById("lMoyVent").value;
  largeurMoyVent = newVal * 60;
  delete tblVents;
  tblVents    = new Array(largeurMoyVent);
  tblVentsIdx = 0
  ventTotal   = 0.0;
  ventMoyen   = 0.0;
  // Efface les moyennes précédentes
  Window.graphVent.data.datasets[1].data = [];
  // Stocke la préférence dans le localStorage
  localStorage.setItem("largeurMoyVent", largeurMoyVent);
}

function inputLargeurPres() {
  // Affiche la largeur de calcul de la moyenne vent
  var lbl = document.getElementById("valMoyPres");
  var newVal = document.getElementById("lMoyPres").value;
  secondes = newVal * 30;
  lbl.innerText = new Date(secondes * 1000).toISOString().substring(15, 19);
}

function changeLargeurPres() {
  // Modifie la largeur de calcul de la moyenne vent
  var newVal = document.getElementById("lMoyPres").value;
  largeurMoyPres = newVal * 60;
  delete tblPres;
  tblPres    = new Array(largeurMoyPres);
  tblVentsIdx = 0
  ventTotal   = 0.0;
  ventMoyen   = 0.0;
  // Efface les moyennes précédentes
  Window.graphVent.data.datasets[1].data = [];
  // Stocke la préférence dans le localStorage
  localStorage.setItem("largeurMoyPres", largeurMoyPres);
}

function inputLargeurTemp() {
  // Affiche la largeur de calcul de la moyenne vent
  var lbl = document.getElementById("valMoyTemp");
  var newVal = document.getElementById("lMoyTemp").value;
  secondes = newVal * 30;
  lbl.innerText = new Date(secondes * 1000).toISOString().substring(15, 19);
}

function changeLargeurTemp() {
  // Modifie la largeur de calcul de la moyenne température
  var newVal = document.getElementById("lMoyTemp").value 
  largeurMoyTemp = newVal * 60;
  delete tblCtn;
  tblCtn           = new Array(largeurMoyTemp);
  tblTempIdx       = 0;
  largeurTempFull  = false;
  ctnTotal         = 0.0;
  ctnMoyen         = 0.0;
  // Efface les moyennes précédentes
  Window.graphTemp.data.datasets[1].data = [];
  // Stocke la préférence dans le localStorage
  localStorage.setItem("largeurMoyTemp", largeurMoyTemp);
}

function getAPconfig() {
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/getapconfig");
  } else {
    XMLHttpRequest_get("/getapconfig");
  }
}

function toogleShowPasswd(dest) {
  if (dest == "ap") {
    const bouton = document.getElementById('btnShowPasswd');
    var apPwd1 = document.getElementById('apPwd1');
    var apPwd2 = document.getElementById('apPwd2');
    if (apPwd1.type === "password") {
      apPwd1.type = "text";
      apPwd2.type = "text";
      bouton.src="images/oeuil-barre.svg"
      bouton.title="Hide password"
    } else {
      apPwd1.type = "password";
      apPwd2.type = "password";
      bouton.src="images/oeuil.svg"
      bouton.title="Show password"
    }
  } else {
    const bouton = document.getElementById('btnShowCliPasswd');
    var pwd_input = document.getElementById('pwd_input');
    if (pwd_input.type === "password") {
      pwd_input.type = "text";
      bouton.src="images/oeuil-barre.svg"
      bouton.title="Hide password"
    } else {
      pwd_input.type = "password";
      bouton.src="images/oeuil.svg"
      bouton.title="Show password"
    }
  }
}

function inputConfigAP() {
  var apSSID      = document.getElementById('apSSID');
  var apPwd1      = document.getElementById('apPwd1');
  var apPwd2      = document.getElementById('apPwd2');
  var btnValideAP = document.getElementById('btnValideAP');
  if ((apPwd1.value == apPwd2.value) && ((apPwd1.value.length == 0) || (apPwd1.value.length >= 8)) && apConfigChange) {
    btnValideAP.src = "images/valid.svg";
    btnValideAP.style.cursor = "pointer";
  } else {
    btnValideAP.src = "images/valid-disable.svg";
    btnValideAP.style.cursor = "default";
  }
}

function updateAPconfig() {
  var apSSID      = document.getElementById('apSSID');
  var apPwd1      = document.getElementById('apPwd1');
  var apPwd2      = document.getElementById('apPwd2');
  if ((apPwd1.value == apPwd2.value) && ((apPwd1.value.length == 0) || (apPwd1.value.length >= 8)) && apConfigChange) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4) {
        if ((xhttp.status == 200) || (xhttp.status == 0)) {
          ////XMLHttpResult("/setapconfig", xhttp.responseXML, xhttp.responseText);
          alert("updateAPconfig():\n" + xhttp.responseText);
        } else {
          alert("updateAPconfig() : Error " + xhttp.status);
        }
      }
    };
    var ssid_encode = encodeURIComponent(apSSID.value);
    var pwd_encode  = encodeURIComponent(apPwd1.value);
    if (location.protocol == 'file:') {
      xhttp.open("POST", netDevURL + "/setapconfig", true);
    } else {
      xhttp.open("POST", "/setapconfig", true);
    }
    xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhttp.send("ssid=" + ssid_encode + "&pwd=" + pwd_encode);
  } else {
    alert("Entered passwords are not identical!");
  }
}

function resetSettings() {
  if (confirm("Reset preferences to default?") == true) {
    localStorage.clear();
    window.location.reload();
  }
}

function reboot() {
  if (confirm("Reboot the weather station?") == true) {
    if (location.protocol == 'file:') {
      XMLHttpRequest_get(netDevURL + "/reboot");
    } else {
      XMLHttpRequest_get("/reboot");
    }
  }
}

function toggleChrono() {
  // Change la visibilité du chrono
  var cadre = document.getElementById('cadre_chrono');
  var btnSon = document.getElementById('boutonSon');

  if (chronoVisible) {
    cadre.classList.add("noshow");
    btnSon.classList.add("noshow");
    chronoVisible = false;
  } else {
    cadre.classList.remove("noshow");
    btnSon.classList.remove("noshow");
    chronoVisible = true;
  }
}

function startStopChrono() {
  var chrono = document.getElementById('chrono0');
  const bouton = document.getElementById('btnChrono');
  if (!chronoRunning) {
    // Démarre le chrono
    chronoRunning   = true;
    // nombre de millisecondes écoulées depuis le premier janvier 1970
    chronoDebut = Date.now();
    bouton.src="images/stop-chrono.svg"
    refreshChrono();
    clignottementChrono();
    if (soundOn) {
      beep(500, notes[0], 2, "sine", function(){flagBeep = false;});
    }
  } else {
    if (confirm("Stopping time countdown?") == true) {
      chronoRunning = false;
      var chrono = document.getElementById('chrono0');
      minutes = Math.trunc(chronoMaxTime / 60);
      seconds = chronoMaxTime % 60;
      newText = minutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + ":" + seconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
      chrono.innerHTML = newText;
      bouton.src="images/start-chrono.svg"
    }
  }
}

function refreshChrono() {
  // Mise à jour de l'affichage du chrono
  var chrono = document.getElementById('chrono0');
  
  if (chronoRunning) {
    var secondesRestante = (chronoMaxTime * 1000) - (Date.now() - chronoDebut);
    if (secondesRestante > 0) {
      minutes = Math.trunc(secondesRestante / 60000);
      seconds = Math.floor((secondesRestante % 60000) / 1000);
      newText = minutes.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}) + chronoSepar + seconds.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
      chrono.innerHTML = newText;
      if ((seconds == 0) && (soundOn)) {
        if (!flagBeep) { // Pour éviter les doubles beeps
          flagBeep = true;
          if (minutes == 0) {
            duree = 1000;
          } else {
            duree = 500;
          }
          beep(duree, notes[7 - minutes], 2, "sine", function(){flagBeep = false;});
        }
      }
    } else {
      chrono.innerHTML = "00:00";
      chronoRunning = false;
      const bouton = document.getElementById('btnChrono');
      bouton.src="images/start-chrono.svg"
    }
    setTimeout(function() { refreshChrono() }, 500);
  } else {
    chrono.innerHTML = "07:00";
  }
}

function clignottementChrono() {
  if (chronoSepar == ':') {
    chronoSepar = '&nbsp;';
  } else {
    chronoSepar = ':';
  }
  if (chronoRunning) {
    setTimeout(function() { clignottementChrono() }, 500);
  } else {
    chronoSepar = ':';
  }
}

//All arguments are optional:
//duration of the tone in milliseconds. Default is 500
//frequency of the tone in hertz. default is 440
//volume of the tone. Default is 1, off is 0.
//type of tone. Possible values are sine, square, sawtooth, triangle, and custom. Default is sine.
//callback to use on end of tone
function beep(duration, frequency, volume, type, callback) {
    var oscillator = audioCtx.createOscillator();
    var gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (volume){gainNode.gain.value = volume;}
    if (frequency){oscillator.frequency.value = frequency;}
    if (type){oscillator.type = type;}
    if (callback){oscillator.onended = callback;}
    if (duration){duree = duration/1000;} else {duree = 0.5;}

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duree);
};

function toggleSon() {
  const bouton = document.getElementById('boutonSon');
  if (soundOn) {
    bouton.src="images/sound-off.svg"
    soundOn =false;
    localStorage.setItem("sound", soundOn);
  } else {
    bouton.src="images/sound-on.svg"
    soundOn = true
    localStorage.setItem("sound", soundOn);
  }
}

function wakeup() {
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/wakeup");
  } else {
    XMLHttpRequest_get("/wakeup");
  }
}

function changeDuree(duree) {
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/setduree?duree=" + duree);
  } else {
    XMLHttpRequest_get("/setduree?duree=" + duree);
  }
}

function clickColor(R, V, B) {
  //alert("Color = rvb(" + R + ", " + V + ", " + B + ")");
  newColor = 'rgb(' + R + ', ' + V + ', ' + B + ')';
  document.getElementById('colorResult').style.backgroundColor = newColor;
  //colorCase = document.getElementById('color.' + R + '.' + V + '.' + B)
  cellID = 'color.' + R + '.' + V + '.' + B
  table  = document.getElementById('colorTable');
  tBody  = table.getElementsByTagName("tbody")[0];
  lignes = tBody.getElementsByTagName("tr")
  for (const l of lignes) {
    cellules = l.getElementsByTagName("td");
    for (const c of cellules) {
      if (c.getAttribute('id') == cellID) {
        c.style.backgroundImage = "url(images/coche.svg)";
      } else {
        c.style.backgroundImage = "";
      }
    }
  }
}

function openColor(colorID) {
  
  colorEnCours = colorID;
  
  newColor = document.getElementById(colorID).style.backgroundColor;
  const [R,V,B,A] = getRVBA(newColor);
  clickColor(R, V, B);

  var dialog = document.getElementById('colorChooser')
  dialog.classList.remove('noshow');

  // Retaille le rond de couleur résultat
  bouton = document.getElementById('okButton');
  taille = bouton.offsetHeight;
  colorResult = document.getElementById('colorResult');
  colorResult.style.height = taille + "px";
  colorResult.style.width  = taille + "px";
  
}

function setColor() {
  switch (colorEnCours) {
    case 'iw':
      couleurVent = newColor;
      couleurFillVent = getFillColor(couleurVent);
      Window.graphVent.options.scales['y'].ticks.color = couleurVent;
      Window.graphVent.data.datasets[0].borderColor = couleurVent;
      Window.graphVent.data.datasets[0].fill.above = couleurFillVent;
      Window.graphVent.data.datasets[0].fill.below = couleurFillVent;
      document.getElementById('iw').style.backgroundColor = couleurVent;
      document.body.style.setProperty('--couleurVent', couleurVent);
      localStorage.setItem(theme + ".couleurVent", couleurVent);
      break;
    case 'ip':
      couleurPression = newColor;
      couleurFillPression = getFillColor(couleurPression);
      Window.graphPres.options.scales['y'].ticks.color = couleurPression;
      Window.graphPres.data.datasets[0].borderColor = couleurPression;
      Window.graphPres.data.datasets[0].fill.above = couleurFillPression;
      Window.graphPres.data.datasets[0].fill.below = couleurFillPression;
      document.getElementById('ip').style.backgroundColor = couleurPression;
      document.body.style.setProperty('--couleurPression', couleurPression);
      localStorage.setItem(theme + ".couleurPression", couleurPression);
      break;
    case 'it':
      couleurTempCtn = newColor;
      couleurFillCtn = getFillColor(couleurTempCtn);
      Window.graphTemp.options.scales['y'].ticks.color = couleurTempCtn;
      Window.graphTemp.data.datasets[0].borderColor = couleurTempCtn;
      Window.graphTemp.data.datasets[0].fill.above = couleurFillCtn;
      Window.graphTemp.data.datasets[0].fill.below = couleurFillCtn;
      document.getElementById('it').style.backgroundColor = couleurTempCtn;
      document.body.style.setProperty('--couleurTempCtn', couleurTempCtn);
      localStorage.setItem(theme + ".couleurTempCtn", couleurTempCtn);
      break;
    case 'aw':
      couleurMoyVent = newColor;
      Window.graphVent.data.datasets[1].borderColor = couleurMoyVent;
      document.getElementById('aw').style.backgroundColor = couleurMoyVent;
      document.body.style.setProperty('--couleurMoyVent', couleurMoyVent);
      localStorage.setItem(theme + ".couleurMoyVent", couleurMoyVent);
      break;
    case 'ap':
      couleurMoyPres = newColor;
      Window.graphPres.data.datasets[1].borderColor = couleurMoyPres;
      document.getElementById('ap').style.backgroundColor = couleurMoyPres;
      document.body.style.setProperty('--couleurMoyPres', couleurMoyPres);
      localStorage.setItem(theme + ".couleurMoyPres", couleurMoyPres);
      break;
    case 'at':
      couleurMoyCtn = newColor;
      Window.graphTemp.data.datasets[1].borderColor = couleurMoyCtn;
      document.getElementById('at').style.backgroundColor = couleurMoyCtn;
      document.body.style.setProperty('--couleurMoyCtn', couleurMoyCtn);
      localStorage.setItem(theme + ".couleurMoyCtn", couleurMoyCtn);
      break;
    default:
      console.log("setColor(): Erreur, colorEnCours invalide");
  }
  closeColor();
}

function closeColor() {
  var dialog = document.getElementById('colorChooser')
  // Ne fonctionne pas sans le timeout ?
  setTimeout(function() { dialog.classList.add('noshow'); }, 10);
}

function getThemeColor(theTheme) {
  // Recupération et correction des choix de couleurs en fonction du theme
  // Vent
  var colorPref = localStorage.getItem(theTheme + ".couleurVent");
  if (colorPref !== null) {
    couleurVent = colorPref;
    couleurFillVent = getFillColor(couleurVent);
  }
  var colorPref = localStorage.getItem(theTheme + ".couleurMoyVent");
  if (colorPref !== null) {
    couleurMoyVent = colorPref;
  }
  // Pression
  var colorPref = localStorage.getItem(theTheme + ".couleurPression");
  if (colorPref !== null) {
    couleurPression = colorPref;
    couleurFillPression = getFillColor(couleurPression);
  }
  var colorPref = localStorage.getItem(theTheme + ".couleurMoyPres");
  if (colorPref !== null) {
    couleurMoyPres = colorPref;
  }
  // Température CTN
  var colorPref = localStorage.getItem(theTheme + ".couleurTempCtn");
  if (colorPref !== null) {
    couleurTempCtn = colorPref;
    couleurFillCtn = getFillColor(couleurTempCtn);
  }
  var colorPref = localStorage.getItem(theTheme + ".couleurMoyCtn");
  if (colorPref !== null) {
    couleurMoyCtn = colorPref;
  }  
}

function getRVBA(color) {
  const [R,V,B,A] = color.match(/\d+/g).map(Number);
  return [R,V,B,A];
}

function getFillColor(couleur) {
  [R,V,B,A] = getRVBA(couleur);
  return 'rgba(' + R + ', ' + V + ', ' + B + ', 0.2)';
}

function setMainDialogColor() {

  var obj = document.getElementById('fondColorTheme');
  if (theme == "sombre") {
    obj.style.backgroundColor = 'black';
    obj.style.color = 'white';
  } else {
    obj.style.backgroundColor = 'white';
    obj.style.color = 'black';
  }
  document.getElementById('iw').style.backgroundColor = couleurVent;
  document.getElementById('ip').style.backgroundColor = couleurPression;
  document.getElementById('it').style.backgroundColor = couleurTempCtn;
  document.getElementById('aw').style.backgroundColor = couleurMoyVent;
  document.getElementById('ap').style.backgroundColor = couleurMoyPres;
  document.getElementById('at').style.backgroundColor = couleurMoyCtn;

}

function resizeActiveColorTable() {
  // retaille les ronds de couleur dans la table de couleur
  var taille = document.getElementById('actr1').offsetHeight
  taille = taille * 0.8;
  radius = taille / 2;

  var obj = document.getElementById('iw');
  obj.style.width = taille +'px';
  obj.style.height = taille + 'px';
  obj.style.borderRadius = radius + 'px';

  obj = document.getElementById('ip');
  obj.style.width = taille +'px';
  obj.style.height = taille + 'px';
  obj.style.borderRadius = radius + 'px';

  obj = document.getElementById('it');
  obj.style.width = taille +'px';
  obj.style.height = taille + 'px';
  obj.style.borderRadius = radius + 'px';

  obj = document.getElementById('aw');
  obj.style.width = taille +'px';
  obj.style.height = taille + 'px';
  obj.style.borderRadius = radius + 'px';

  obj = document.getElementById('ap');
  obj.style.width = taille +'px';
  obj.style.height = taille + 'px';
  obj.style.borderRadius = radius + 'px';

  obj = document.getElementById('at');
  obj.style.width = taille +'px';
  obj.style.height = taille + 'px';
  obj.style.borderRadius = radius + 'px';

}


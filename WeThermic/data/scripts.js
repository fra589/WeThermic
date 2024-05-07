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

var cssFile = 'style_theme_sombre.css';

// Couleurs par défaut
var couleurVent         = 'rgb(0, 180, 255)';
var couleurFillVent     = 'rgba(0, 180, 255, 0.3)';
var couleurMoyVent      = 'rgb(160, 0, 180)';
var couleurPression     = 'rgb(0, 127, 127)';
var couleurFillPression = 'rgba(0, 127, 127, 0.2)';
var couleurTempBMP180   = 'rgb(255, 63, 32)';
var couleurMoyBMP180    = 'rgb(204, 27, 0)';
var couleurTempCtn      = 'rgb(0, 255, 0)';
var couleurMoyCtn       = 'rgb(0, 180, 0)';
var couleurGrid         = 'rgb(31, 47, 63)';

var attenteOK  = false;
var vent        = 0.0;
var temperature = 0.0;
var pression    = 0.0;
var tempctn     = 0.0;

var largeurMoyVent = 120; // Moyenne sur 1 minute
var tblVents       = new Array(largeurMoyVent);
var tblVentsIdx    = 0;
var ventTotal      = 0.0;
var ventMoyen      = 0.0;

var largeurMoyTemp  = 120; // Moyenne sur 1 minutes
var largeurTempFull = false;
var tblTempIdx      = 0;
var tblTemp         = new Array(largeurMoyTemp);
var tempTotale      = 0.0;
var tempMoyene      = 0.0;
var tblCtn         = new Array(largeurMoyTemp);
var ctnTotal       = 0.0;
var ctnMoyen       = 0.0;

var showT1    = true;
var showT2    = false;
var showPress = true;

let screenLock;

function index_onload() {

  // Charge le fichier de style par défaut
  loadStyle();
  
  // Redimentionnement des graphiques en fonction de la page
  height = window.innerHeight;
  width  = window.innerWidth;

  //alert(width + "\n" + height);
  document.getElementById("lapage").style.height = height + "px";
  document.getElementById("lapage").style.width = width + "px";

  // Mise à jour des infos de version
  if (location.protocol == 'file:') {
    XMLHttpRequest_get("http://192.168.1.107/getversion");
  } else {
    XMLHttpRequest_get("/getversion");
  }
  // Récupère les premières valeurs de manière synchrone
  // pour initialisation des graphiques.
  XMLHttpRequest_get_first_values();

  // Configuration des graphiques
  var style = getComputedStyle(document.body);

  // vent
  var ventData = {
    datasets: [
      {
        cubicInterpolationMode: 'monotone',
        data: [],
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
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: false,
        borderColor: couleurMoyVent,
        borderWidth:2,
        order: 1,
        tension: 0.4
      },
      {
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: {
          target: 'origin',
          above: couleurFillPression,
          below: couleurFillPression
        },
        borderColor: couleurPression,
        borderWidth:1,
        order: 5,
        tension: 0.25,
        yAxisID: 'y1'
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
          duration: 300000,
          refresh: 500,
          delay: 50,
          frameRate: 4,
          onRefresh: chart => {
            chart.data.datasets[0].data.push({
              x: Date.now(),
              y: vent
            });
            chart.data.datasets[1].data.push({
              x: Date.now(),
              y: ventMoyen
            });
            chart.data.datasets[2].data.push({
              x: Date.now(),
              y: pression
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
        beginAtZero: true,
        suggestedMax: 5,
        ticks: {
          color: couleurVent
        },
        grid: {
          color: couleurGrid
        }
      },
      y1: {
        type: 'linear',
        beginAtZero: false,
        display: true,
        position:'right',
        suggestedMax: pression + 0.5,
        suggestedMin: pression - 0.05,
        ticks: {
          color: couleurPression
        },
        grid: {
          color: couleurGrid
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };
  // Temperature & Pression
  var tempData = {
    datasets: [
      {
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: false,
        borderColor: couleurTempCtn,
        borderWidth:2,
        order: 1,
        tension: 0.25,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: false,
        borderColor: couleurMoyCtn,
        borderWidth:3,
        order: 2,
        tension: 0.25,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: false,
        borderColor: couleurTempBMP180,
        borderWidth:2,
        order: 3,
        tension: 0.25,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: false,
        borderColor: couleurMoyBMP180,
        borderWidth:3,
        order: 4,
        tension: 0.25,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'monotone',
        data: [],
        fill: {
          target: 'origin',
          above: couleurFillPression,
          below: couleurFillPression
        },
        borderColor: couleurPression,
        borderWidth:1,
        order: 5,
        tension: 0.25,
        yAxisID: 'y1'
      }
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
          duration: 300000,
          refresh: 500,
          delay: 50,
          frameRate: 4,
          onRefresh: chart => {
            chart.data.datasets[0].data.push({
              x: Date.now(),
              y: tempctn
            });
            chart.data.datasets[1].data.push({
              x: Date.now(),
              y: ctnMoyen
            });
            chart.data.datasets[2].data.push({
              x: Date.now(),
              y: temperature
            });
            chart.data.datasets[3].data.push({
              x: Date.now(),
              y: tempMoyene
            });
            chart.data.datasets[4].data.push({
              x: Date.now(),
              y: pression
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
        suggestedMax: tempctn + 0.25,
        suggestedMin: tempctn - 0.25,
        ticks: {
          color: couleurTempCtn
        },
        grid: {
          color: couleurGrid
        }
      },
      y1: {
        type: 'linear',
        beginAtZero: false,
        display: true,
        position:'right',
        suggestedMax: pression + 0.5,
        suggestedMin: pression - 0.05,
        ticks: {
          color: couleurPression
        },
        grid: {
          color: couleurGrid
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  // Récupération des valeurs (vent, température et pression)
  if (location.protocol == 'file:') {
    setTimeout(function() { XMLHttpRequest_get("http://192.168.1.107/getvalues") }, 500);
  } else {
    setTimeout(function() { XMLHttpRequest_get("/getvalues") }, 500);
  }
  // Création des graphiques
  Window.graphVent = new Chart(document.getElementById('graphVent'), {
    type: 'line',
    data: ventData,
    options: ventOptions
  });
  Window.graphTemp = new Chart(document.getElementById('graphTemp'), {
    type: 'line',
    data: tempData,
    options: tempOptions
    //configTemp
  });
  // Masque le graphique de pression en bas
  Window.graphTemp.setDatasetVisibility(4, false); // hides dataset at index 1
  Window.graphTemp.options.scales['y1'].ticks.display = false;
  Window.graphTemp.options.scales['y1'].grid.display = false;
  // Par défaut, le graphe de température du BMP180 est masqué (showT2 = false)
  Window.graphTemp.setDatasetVisibility(2, showT2);
  Window.graphTemp.setDatasetVisibility(3, showT2);

  Window.graphTemp.update();
  
  // Blocage de la mise en veille (ne fonctionne qu'en HTTPS ?)
  getScreenLock();

}

function loadStyle() {

  var head = document.getElementsByTagName('head')[0] ;
    
  // Creating link element
  var style = document.createElement('link')
  style.id   = 'cssTheme';
  style.rel  = 'stylesheet';
  style.type = 'text/css';
  style.href = cssFile;
  head.append(style);

}

function echelleTemperature(scaleTemp) {
  // Ajustement de l'échelle des températures
  if (scaleTemp == 0) {
    Window.graphTemp.options.scales['y'].suggestedMax = tempctn + 0.5;
    Window.graphTemp.options.scales['y'].suggestedMin = tempctn - 0.5;
  } else if (scaleTemp == 1) {
    Window.graphTemp.options.scales['y'].suggestedMax = tempctn + 0.25;
    Window.graphTemp.options.scales['y'].suggestedMin = tempctn - 0.25;
  } else if (scaleTemp == 2) {
    Window.graphTemp.options.scales['y'].suggestedMax = tempctn + 0.125;
    Window.graphTemp.options.scales['y'].suggestedMin = tempctn - 0.125;
  } else if (scaleTemp == 3) {
    Window.graphTemp.options.scales['y'].suggestedMax = tempctn;
    Window.graphTemp.options.scales['y'].suggestedMin = tempctn;
  }
}

function recalePression() {
  // On recalle le graph de pression
  Window.graphTemp.options.scales['y1'].suggestedMax = pression + 0.5;
  Window.graphTemp.options.scales['y1'].suggestedMin = pression;
  // Mise à jour du graphe
  Window.graphTemp.update();
}

function XMLHttpRequest_get_first_values() {
  // HTTP synchronous request
  const request = new XMLHttpRequest();
  if (location.protocol == 'file:') {
    request.open("GET", "http://192.168.1.107/getvalues", false); // `false` makes the request synchronous
  } else {
    request.open("GET", "/getvalues", false); // `false` makes the request synchronous
  }
  request.send(null);

  if (request.status === 200) {
    var xml = request.responseXML;
    vent        = Number(xml.getElementsByTagName("vent")[0].childNodes[0].nodeValue);
    ventMoyen   = vent;
    tempctn     = Number(xml.getElementsByTagName("tempctn")[0].childNodes[0].nodeValue);
    ctnMoyen    = tempctn;
    temperature = Number(xml.getElementsByTagName("temperature")[0].childNodes[0].nodeValue);
    tempMoyene  = temperature;
    pression    = Number(xml.getElementsByTagName("pression")[0].childNodes[0].nodeValue);
  }

}

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
    if ((requette == "/getversion") || (requette == "http://192.168.1.107/getversion")) {
      var version_string = xml.getElementsByTagName("string")[0].childNodes[0].nodeValue;
      var doc_version = document.getElementById("version");
      doc_version.textContent = version_string;

    } else if ((requette == "/getvalues") || (requette == "http://192.168.1.107/getvalues")) {
      vent        = Number(xml.getElementsByTagName("vent")[0].childNodes[0].nodeValue);
      calculMoyenneVent();

      var doc_vent  = document.getElementById("valeurVent");
      doc_vent.innerHTML    ='<span class="couleurMoyVent">moy = ' + Number.parseFloat(ventMoyen).toFixed(1) + '</span>,&nbsp;';
      doc_vent.innerHTML   += '<span class="couleurVent">inst = ' + Number.parseFloat(vent).toFixed(1).padStart(4, ' ') + ' m/s</span>';

      tempctn     = Number(xml.getElementsByTagName("tempctn")[0].childNodes[0].nodeValue);
      temperature = Number(xml.getElementsByTagName("temperature")[0].childNodes[0].nodeValue);
      calculMoyenneTemperature();

      var showT1 = document.getElementById("showT1").checked; 

      var doc_temp = document.getElementById("valeurTemp");
      doc_temp.innerHTML    = ""
      if (showT2) {
        doc_temp.innerHTML   += '<span class="couleurMoyBMP180">moy = '   + Number.parseFloat(tempMoyene).toFixed(1) + '</span>,&nbsp;';
        doc_temp.innerHTML   += '<span class="couleurTempBMP180">inst = ' + Number.parseFloat(temperature).toFixed(2) + '°C</span><br />';
      }
      if (showT1) {
        doc_temp.innerHTML   += '<span class="couleurMoyCtn">moy = '      + Number.parseFloat(ctnMoyen).toFixed(1) + '</span>,&nbsp;';
        doc_temp.innerHTML   += '<span class="couleurTempCtn">inst = '    + Number.parseFloat(tempctn).toFixed(2) + '°C</span>'
      }

      pression    = Number(xml.getElementsByTagName("pression")[0].childNodes[0].nodeValue);

      var doc_press = document.getElementById("valeurPress");
      doc_press.innerHTML = '<span class="couleurPression">' + Number.parseFloat(pression).toFixed(1) + "hPa</span>";

      attenteOK = true;
    }
  }

  if ((requette == "/getvalues") || (requette == "http://192.168.1.107/getvalues")) {
      // Appel recursif pour boucler au lieu d'utiliser  setInterval()
      // Cela assure que te traitement à été terminé avant de relancer
      // la requette vers le serveur web.
      autoRefresh();
  }
}

function autoRefresh() {
  var chkRefresh = document.getElementById("auto_refresh");
  if (chkRefresh.checked) {
    // Appel recursif pour boucler au lieu d'utiliser  setInterval()
    // Cela assure que te traitement à été terminé avant de relancer
    // la requette vers le serveur web.
    if (location.protocol == 'file:') {
      setTimeout(function() { XMLHttpRequest_get("http://192.168.1.107/getvalues") }, 500);
    } else {
      setTimeout(function() { XMLHttpRequest_get("/getvalues") }, 500);
    }
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
  }

  // calcul la moyenne
  ventMoyen = Math.round(ventTotal / largeurMoyVent * 10)/10;
  
}

function calculMoyenneTemperature() {

  // Remplace l'élément pointé par l'indexe et recalcul le total
  if (isNaN(tblTemp[tblTempIdx])) {
    // Initialise l'élément du tableau pour la première fois
    tblTemp[tblTempIdx] = 0
    tblCtn[tblTempIdx] = 0
  }

  tempTotale = tempTotale - tblTemp[tblTempIdx];
  ctnTotal   = ctnTotal   - tblCtn[tblTempIdx];
  tblTemp[tblTempIdx] = temperature;
  tblCtn[tblTempIdx] = tempctn;
  tempTotale = tempTotale + tblTemp[tblTempIdx];
  ctnTotal = ctnTotal + tblCtn[tblTempIdx];

  // Avance l'indexe du tableau
  tblTempIdx = tblTempIdx + 1;
  if (tblTempIdx >= largeurMoyTemp) {
    tblTempIdx = 0;
    largeurTempFull = true;
  }

  if (largeurTempFull) {
    // calcul la moyenne sur l'ensemble du tableau
    tempMoyene = Math.round(tempTotale / largeurMoyTemp * 100)/100;
    ctnMoyen   = Math.round(ctnTotal / largeurMoyTemp * 100)/100;
  } else {
    // calcul la moyenne jusqu'à l'indexe (le tableau n'est pas complet).
    tempMoyene = Math.round(tempTotale / tblTempIdx * 100)/100;
    ctnMoyen = Math.round(ctnTotal / tblTempIdx * 100)/100;
  }
  
}

function changeSettings() {

  var dialog = document.getElementById('settingsDialog')
  dialog.classList.remove("noshow");


}

function closeSettings() {
  var dialog = document.getElementById('settingsDialog')
  dialog.classList.add("noshow");
}

function changeTheme(theme) {

  if ((theme == 'clair') && (cssFile == 'style_theme_sombre.css')) {
    cssFile = 'style_theme_clair.css';
    themeStyle = document.getElementById('cssTheme');
    themeStyle.href = cssFile;
  } else if ((theme == 'sombre') && (cssFile == 'style_theme_clair.css')) {
    cssFile = 'style_theme_sombre.css';
    themeStyle = document.getElementById('cssTheme');
    themeStyle.href = cssFile;
  }

  setTimeout(() => {
    // setTimeout() pour laisser le temps de recherger le CSS
    // Reconfiguration des graphiques --couleurVent: rgb(0 0 160);
    var style = getComputedStyle(document.body);
    couleurVent         = style.getPropertyValue('--couleurVent');
    couleurFillVent     = style.getPropertyValue('--couleurFillVent');
    couleurPression     = style.getPropertyValue('--couleurPression');
    couleurFillPression = style.getPropertyValue('--couleurFillPression');
    couleurTempCtn      = style.getPropertyValue('--couleurTempCtn');
    couleurMoyCtn       = style.getPropertyValue('--couleurMoyCtn');
    couleurGrid         = style.getPropertyValue('--couleurGrid');

    Window.graphVent.data.datasets[0].borderColor = couleurVent;
    Window.graphVent.data.datasets[0].fill.above = couleurFillVent;
    Window.graphVent.data.datasets[0].fill.below = couleurFillVent;
    Window.graphVent.options.scales['y'].ticks.color = couleurVent;
    Window.graphVent.options.scales['x'].grid.color = couleurGrid;
    Window.graphVent.options.scales['y'].grid.color = couleurGrid;
    Window.graphVent.data.datasets[2].borderColor = couleurPression;
    Window.graphVent.data.datasets[2].fill.above = couleurFillPression;
    Window.graphVent.data.datasets[2].fill.below = couleurFillPression;
    
    Window.graphTemp.data.datasets[0].borderColor = couleurTempCtn;
    Window.graphTemp.data.datasets[1].borderColor = couleurMoyCtn;
    Window.graphTemp.data.datasets[4].borderColor = couleurPression;
    Window.graphTemp.data.datasets[4].fill.above = couleurFillPression;
    Window.graphTemp.data.datasets[4].fill.below = couleurFillPression;
    Window.graphTemp.options.scales['y1'].ticks.color = couleurPression;
    Window.graphTemp.options.scales['x'].grid.color = couleurGrid;
    Window.graphTemp.options.scales['y'].grid.color = couleurGrid;
    Window.graphTemp.options.scales['y1'].grid.color = couleurGrid;

  }, 500);
  
}

function visuCourbes() {
  
  // Affiche ou masque les différentes courbes

  showPress = document.getElementById("showPress").checked; 
  Window.graphVent.setDatasetVisibility(2, showPress);
  Window.graphVent.options.scales['y1'].ticks.display = showPress;
  Window.graphVent.options.scales['y1'].grid.display = showPress;
  
  showT1 = document.getElementById("showT1").checked; 
  Window.graphTemp.setDatasetVisibility(0, showT1);
  Window.graphTemp.setDatasetVisibility(1, showT1);
  
  showT2 = document.getElementById("showT2").checked; 
  Window.graphTemp.setDatasetVisibility(2, showT2);
  Window.graphTemp.setDatasetVisibility(3, showT2);

}


  
  
  
  



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







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
var cssFile = 'style_theme_sombre.css';
// Durée de calcul des moyennes
var largeurMoyVent  = 180; // Moyenne sur 1 minute 30s
var largeurMoyTemp  = 180; // Moyenne sur 1 minutes 30s
// Visibilité des courbes
var showWind      = true;
var showT1        = true;
var showT2        = false;
var showPressU    = true;
var showPressL    = false;
var showPressGrid = true
//------------------------------------------------------------------------------------------


// pour debug du developpement, adresse IP de la Wemos connectée au wifi
var netDevURL = 'http://192.168.1.107'; // domopassaduy
//var netDevURL = 'http://192.168.1.68'; // BlancheNeige
//var netDevURL = 'http://192.168.1.60'; // La Gouffrerie

// Couleurs par défaut du theme sombre
var couleurVent         = 'rgb(0, 180, 255)';
var couleurFillVent     = 'rgba(0, 180, 255, 0.3)';
var couleurMoyVent      = 'rgb(0, 125, 179)';
var couleurPression     = 'rgb(0, 127, 127)';
var couleurFillPression = 'rgba(0, 127, 127, 0.2)';
var couleurTempCtn      = 'rgb(255, 63, 32)';
var couleurFillCtn      = 'rgba(255, 63, 32, 0.2)';
var couleurMoyCtn       = 'rgb(204, 27, 0)';
var couleurTempBmp180   = 'rgb(0, 255, 0)';
var couleurMoyBMP180    = 'rgb(0, 180, 0)';
var couleurGrid         = 'rgb(31, 47, 63)';

var attenteOK  = false;

var histVentData    = new Array();
var histVentMoy     = new Array();
var vent            = 0.0;
var histTempCtn     = new Array();
var histTCtnMoy     = new Array();
var tempctn         = 0.0;
var ctnSuggestedMax = 0.0;
var ctnSuggestedMin = 0.0;
var histBmp180Data  = new Array();
histBmp180Moy       = new Array();
var tempBmp180      = 0.0;
var histPression    = new Array();
var pression        = 0.0;
var pSuggestedMax = 0.0;
var pSuggestedMin = 0.0;

tblVents            = new Array(largeurMoyVent);
var tblVentsIdx     = 0;
var ventTotal       = 0.0;
var ventMoyen       = 0.0;

tblTemp             = new Array(largeurMoyTemp);
var tblTempIdx      = 0;
var largeurTempFull = false;
var bmp180Total     = 0.0;
var bmp180Moyen     = 0.0;
tblCtn              = new Array(largeurMoyTemp);
var ctnTotal        = 0.0;
var ctnMoyen        = 0.0;

var isFullScreen    = false;

var apConfigChange  = false;

function index_onload() {

  // Restauration des préférences avec l'API localStorage plutôt que des cookies
  var cssPref = localStorage.getItem("cssFile");
  if (cssPref !== null) {
    cssFile = cssPref;
  }
  if (cssFile == 'style_theme_sombre.css') {
    document.getElementById("sombre").checked = true;
  } else {
    document.getElementById("clair").checked = true;
  }
  loadStyle();

  // Durée de calcul des moyennes par défaut ou celui défini dans le localStorage
  var moyPref = localStorage.getItem("largeurMoyVent");
  if (moyPref !== null) {
    largeurMoyVent = Number(moyPref);
  }
  moyPref = localStorage.getItem("largeurMoyTemp");
  if (moyPref !== null) {
    largeurMoyTemp = Number(moyPref);
  }
  document.getElementById("lMoyVent").value = largeurMoyVent / 60;
  inputLargeurVent();
  document.getElementById("lMoyTemp").value = largeurMoyTemp / 60;
  inputLargeurTemp();

  // Visibilité des courbes
  var visiPref = localStorage.getItem("showWind");
  if (visiPref !== null) {
    showWind = visiPref;
  }
  var visiPref = localStorage.getItem("showT1");
  if (visiPref !== null) {
    showT1 = visiPref;
  }
  var visiPref = localStorage.getItem("showT2");
  if (visiPref !== null) {
    showT2 = visiPref;
  }
  var visiPref = localStorage.getItem("showPressU");
  if (visiPref !== null) {
    showPressU = visiPref;
  }
  var visiPref = localStorage.getItem("showPressL");
  if (visiPref !== null) {
    showPressL = visiPref;
  }
  var visiPref = localStorage.getItem("showPressGrid");
  if (visiPref !== null) {
    showPressGrid = visiPref;
  }
  document.getElementById("showWind").checked      = showWind;
  document.getElementById("showT1").checked        = showT1;
  document.getElementById("showT2").checked        = showT2;
  document.getElementById("showPressU").checked    = showPressU;
  document.getElementById("showPressL").checked    = showPressL;
  document.getElementById("showPressGrid").checked = showPressGrid;

  // Redimentionnement des graphiques en fonction de la page
  height = window.innerHeight;
  width  = window.innerWidth;
  //alert(width + "\n" + height);
  document.getElementById("lapage").style.height = height + "px";
  document.getElementById("lapage").style.width = width + "px";

  // Mise à jour des infos de version
  if (location.protocol == 'file:') {
    XMLHttpRequest_get(netDevURL + "/getversion");
  } else {
    XMLHttpRequest_get("/getversion");
  }

  // Récupère les premières valeurs de manière synchrone
  // pour initialisation des graphiques.
  // XMLHttpRequest_get_first_values(); => inclu dans get_history()
  XMLHttpRequest_get_history();

  // Ajuste les échelles Y
  ctnSuggestedMax = ctnMoyen + 1.5;
  ctnSuggestedMin = ctnMoyen - 0.25;
  pSuggestedMax   = pression + 0.5;
  pSuggestedMin   = pression - 0.05;

  // vent
  var ventData = {
    datasets: [
      {
        ////cubicInterpolationMode: 'monotone',
        cubicInterpolationMode: 'default',
        //data: [],
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
      },
      {
        cubicInterpolationMode: 'default',
        data: histPression,
        fill: {
          target: 'origin',
          above: couleurFillPression,
          below: couleurFillPression
        },
        borderColor: couleurPression,
        borderWidth:1,
        order: 5,
        tension: 0.4,
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
        suggestedMax: pSuggestedMax,
        suggestedMin: pSuggestedMin,
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
      {
        cubicInterpolationMode: 'default',
        data: histBmp180Data,
        fill: false,
        borderColor: couleurTempBmp180,
        borderWidth:2,
        order: 3,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'default',
        data: histBmp180Moy,
        fill: false,
        borderColor: couleurMoyBMP180,
        borderWidth:3,
        order: 4,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        cubicInterpolationMode: 'default',
        data: histPression,
        fill: {
          target: 'origin',
          above: couleurFillPression,
          below: couleurFillPression
        },
        borderColor: couleurPression,
        borderWidth:1,
        order: 5,
        tension: 0.4,
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
            chart.data.datasets[2].data.push({
              x: Date.now(),
              y: tempBmp180
            });
            chart.data.datasets[3].data.push({
              x: Date.now(),
              y: bmp180Moyen
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
        suggestedMax: ctnSuggestedMax,
        suggestedMin: ctnSuggestedMin,
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
        suggestedMax: pSuggestedMax,
        suggestedMin: pSuggestedMin,
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
    setTimeout(function() { XMLHttpRequest_get(netDevURL + "/getvalues") }, 500);
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
  // Masque toutes les courbes
  // (pour éviter le flash des courbes non visibles)
  Window.graphVent.setDatasetVisibility(0, false);
  Window.graphVent.setDatasetVisibility(1, false);
  Window.graphVent.setDatasetVisibility(2, false);
  Window.graphTemp.setDatasetVisibility(0, false);
  Window.graphTemp.setDatasetVisibility(1, false);
  Window.graphTemp.setDatasetVisibility(2, false);
  Window.graphTemp.setDatasetVisibility(3, false);
  Window.graphTemp.setDatasetVisibility(4, false);
  Window.graphTemp.update();
  // Affiche les courbes visibles en fonction des préférences
  visuCourbes();

  /* A compléter...
   * cf. https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
   * cf. https://mdn.github.io/dom-examples/screen-wake-lock-api/
  // Blocage de la mise en veille - ne fonctionne qu'en HTTPS :-(
  if (location.protocol == 'https:') {
    getScreenLock();
  }
  */

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

  var scaleMin = document.getElementById("scaleMin");
  var scaleMax = document.getElementById("scaleMax");

  if (scaleTemp == 0) {
    suggestedMax = ctnMoyen + 3;
    suggestedMin = ctnMoyen - 0.5;
  } else if (scaleTemp == 1) {
    suggestedMax = ctnMoyen + 2;
    suggestedMin = ctnMoyen - 0.25;
  } else if (scaleTemp == 2) {
    suggestedMax = ctnMoyen + 1;
    suggestedMin = ctnMoyen - 0.125;
  } else if (scaleTemp == 3) {
    suggestedMax = ctnMoyen;
    suggestedMin = ctnMoyen;
  } else if (scaleTemp == -1) {
    suggestedMax = scaleMax.value;
    suggestedMin = scaleMin.value;
  }
  
  scaleMin.value = suggestedMin;
  scaleMax.value = suggestedMax;
  Window.graphTemp.options.scales['y'].suggestedMax = suggestedMax;
  Window.graphTemp.options.scales['y'].suggestedMin = suggestedMin;

}

function recalePression() {
  // On recalle le graph de pression
  Window.graphTemp.options.scales['y1'].suggestedMax = pression + 0.5;
  Window.graphTemp.options.scales['y1'].suggestedMin = pression;
  // Mise à jour du graphe
  Window.graphTemp.update();
}

function XMLHttpRequest_get_history() {

  const request = new XMLHttpRequest();
  if (location.protocol == 'file:') {
    request.open("GET", netDevURL + "/history", false); // `false` makes the request synchronous
  } else {
    request.open("GET", "/history", false); // `false` makes the request synchronous
  }
  request.send(null);

  if (request.status === 200) {
    var xml = request.responseXML;
    // nombre de millisecondes écoulées depuis le premier janvier 1970
    tX = Date.now();
    // Il y a 5 minutes :
    tX = tX - (5 * 60 * 1000) 
    hist = xml.getElementsByTagName("hist");
    for (const h of hist) {
      pression   = Number(h.getElementsByTagName("press")[0].childNodes[0].nodeValue);
      if (pression != 0) {
        // Donnée d'historique définie uniquement si pression != 0
        vent       = Number(h.getElementsByTagName("vent")[0].childNodes[0].nodeValue);
        calculMoyenneVent();
        tempctn    = Number(h.getElementsByTagName("tempctn")[0].childNodes[0].nodeValue);
        tempBmp180 = Number(h.getElementsByTagName("tbmp180")[0].childNodes[0].nodeValue);
        calculMoyenneTemperature();
        // Envoie les données d'historique dans le graphique
        histVentData.push  ({x: tX, y: vent});
        histVentMoy.push   ({x: tX, y: ventMoyen});
        histTempCtn.push   ({x: tX, y: tempctn});
        histTCtnMoy.push   ({x: tX, y: ctnMoyen});
        histBmp180Data.push({x: tX, y: tempBmp180});
        histBmp180Moy.push ({x: tX, y: bmp180Moyen});
        histPression.push  ({x: tX, y: pression});
      }
      tX += 500 // pas des mesures = 500 ms
    }
  }

}

function XMLHttpRequest_get_history_old() {

  const request = new XMLHttpRequest();
  if (location.protocol == 'file:') {
    request.open("GET", netDevURL + "/history", false); // `false` makes the request synchronous
  } else {
    request.open("GET", "/history", false); // `false` makes the request synchronous
  }
  request.send(null);

  if (request.status === 200) {
    var xml = request.responseXML;
    // nombre de millisecondes écoulées depuis le premier janvier 1970
    tX = Date.now();
    // Il y a 5 minutes :
    tX = tX - (5 * 60 * 1000) 
    hist = xml.getElementsByTagName("histvent");
    for (const vent of hist) {
      histVentData.push({x: tX, y: vent.childNodes[0].nodeValue});
      tX += 500 // pas des mesures = 500 ms
    }
    vent = histVentData[histVentData.length -1];
    ventMoyen   = vent;
    // histtempctn
    tX = tX - (5 * 60 * 1000) 
    hist = xml.getElementsByTagName("histtempctn");
    for (const temp of hist) {
      histTempCtn.push({x: tX, y: temp.childNodes[0].nodeValue});
      tX += 500 // pas des mesures = 500 ms
    }
    tempctn = histTempCtn[histTempCtn.length -1];
    ctnMoyen    = tempctn;
    // histbmp180
    tX = tX - (5 * 60 * 1000) 
    hist = xml.getElementsByTagName("histbmp180");
    for (const bmp180 of hist) {
      histBmp180Data.push({x: tX, y: bmp180.childNodes[0].nodeValue});
      tX += 500 // pas des mesures = 500 ms
    }
    tempBmp180 = histBmp180Data[histBmp180Data.length -1];
    bmp180Moyen = tempBmp180;
    // histpression
    tX = tX - (5 * 60 * 1000) 
    hist = xml.getElementsByTagName("histpression");
    for (const press of hist) {
      histPression.push({x: tX, y: press.childNodes[0].nodeValue});
      tX += 500 // pas des mesures = 500 ms
    }
    pression = histPression[histPression.length -1];
  }

}

function XMLHttpRequest_get_first_values() {
  // HTTP synchronous request
  const request = new XMLHttpRequest();
  if (location.protocol == 'file:') {
    request.open("GET", netDevURL + "/getvalues", false); // `false` makes the request synchronous
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
    tempBmp180  = Number(xml.getElementsByTagName("temperature")[0].childNodes[0].nodeValue);
    bmp180Moyen = tempBmp180;
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
    if ((requette == "/getversion") || (requette == netDevURL + "/getversion")) {
      var version_string = xml.getElementsByTagName("string")[0].childNodes[0].nodeValue;
      var doc_version = document.getElementById("version");
      doc_version.textContent = version_string;

    } else if ((requette == "/getvalues") || (requette == netDevURL + "/getvalues")) {
      vent        = Number(xml.getElementsByTagName("vent")[0].childNodes[0].nodeValue);
      calculMoyenneVent();

      var doc_vent  = document.getElementById("valeurVent");
      doc_vent.innerHTML    ='<span class="couleurMoyVent">moy = ' + Number.parseFloat(ventMoyen).toFixed(1) + '</span>,&nbsp;';
      doc_vent.innerHTML   += '<span class="couleurVent">inst = ' + Number.parseFloat(vent).toFixed(1).padStart(4, ' ') + ' m/s</span>';

      tempctn     = Number(xml.getElementsByTagName("tempctn")[0].childNodes[0].nodeValue);
      tempBmp180  = Number(xml.getElementsByTagName("temperature")[0].childNodes[0].nodeValue);
      calculMoyenneTemperature();

      var showT1 = document.getElementById("showT1").checked; 

      var doc_temp = document.getElementById("valeurTemp");
      doc_temp.innerHTML    = ""
      if (showT2) {
        doc_temp.innerHTML   += '<span class="couleurMoyBMP180">moy = '   + Number.parseFloat(bmp180Moyen).toFixed(1) + '</span>,&nbsp;';
        doc_temp.innerHTML   += '<span class="couleurTempBmp180">inst = ' + Number.parseFloat(tempBmp180).toFixed(2) + '°C</span><br />';
      }
      if (showT1) {
        doc_temp.innerHTML   += '<span class="couleurMoyCtn">moy = '      + Number.parseFloat(ctnMoyen).toFixed(1) + '</span>,&nbsp;';
        doc_temp.innerHTML   += '<span class="couleurTempCtn">inst = '    + Number.parseFloat(tempctn).toFixed(2) + '°C</span>'
      }

      pression    = Number(xml.getElementsByTagName("pression")[0].childNodes[0].nodeValue);

      var doc_press = document.getElementById("valeurPress");
      doc_press.innerHTML = '<span class="couleurPression">' + Number.parseFloat(pression).toFixed(1) + "hPa</span>";

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
      apSSID.value   = ssid;
      apPwd1.value   = pwd;
      apConfigChange = false;
      inputConfigAP();
    }
    
  }

  if ((requette == "/getvalues") || (requette == netDevURL + "/getvalues")) {
      // Appel recursif pour boucler au lieu d'utiliser  setInterval()
      // Cela assure que te traitement à été terminé avant de relancer
      // la requette vers le serveur web.
      autoRefresh();
  }
}

function autoRefresh() {
  // Appel recursif pour boucler au lieu d'utiliser  setInterval()
  // Cela assure que te traitement à été terminé avant de relancer
  // la requette vers le serveur web.
  if (location.protocol == 'file:') {
    setTimeout(function() { XMLHttpRequest_get(netDevURL + "/getvalues") }, 500);
  } else {
    setTimeout(function() { XMLHttpRequest_get("/getvalues") }, 500);
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

  bmp180Total = bmp180Total - tblTemp[tblTempIdx];
  ctnTotal   = ctnTotal   - tblCtn[tblTempIdx];
  tblTemp[tblTempIdx] = tempBmp180;
  tblCtn[tblTempIdx] = tempctn;
  bmp180Total = bmp180Total + tblTemp[tblTempIdx];
  ctnTotal = ctnTotal + tblCtn[tblTempIdx];

  // Avance l'indexe du tableau
  tblTempIdx = tblTempIdx + 1;
  if (tblTempIdx >= largeurMoyTemp) {
    tblTempIdx = 0;
    largeurTempFull = true;
  }

  if (largeurTempFull) {
    // calcul la moyenne sur l'ensemble du tableau
    bmp180Moyen = Math.round(bmp180Total / largeurMoyTemp * 100)/100;
    ctnMoyen    = Math.round(ctnTotal / largeurMoyTemp * 100)/100;
  } else {
    // calcul la moyenne jusqu'à l'indexe (le tableau n'est pas complet).
    bmp180Moyen = Math.round(bmp180Total / tblTempIdx * 100)/100;
    ctnMoyen    = Math.round(ctnTotal / tblTempIdx * 100)/100;
  }
  
}

function changeSettings() {

  var dialog = document.getElementById("settingsDialog")
  dialog.classList.remove("noshow");

  var attente = document.getElementById("attente0")
  attente.classList.remove("noshow");

  // mise à jour des champs de saisie
  var scaleMin = document.getElementById("scaleMin");
  var scaleMax = document.getElementById("scaleMax");
  var valeur = Window.graphTemp.scales['y'].max;
  scaleMax.value = valeur;
  var valeur = Window.graphTemp.scales['y'].min;
  scaleMin.value = valeur;

  // récupère la config AP
  getAPconfig();

  // Récupère la liste des réseaux disponibles
  get_networks();

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
  // Sauvegarde préférece
  localStorage.setItem("cssFile", cssFile);

  setTimeout(() => {
    // setTimeout() pour laisser le temps de recharger le CSS
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
  
  // Graphique supérieurs
  newValue = document.getElementById("showWind").checked;
  if (newValue != showWind) {
    showWind = newValue;
    localStorage.setItem("showWind", showWind);
  }
  Window.graphVent.setDatasetVisibility(0, showWind);
  Window.graphVent.setDatasetVisibility(1, showWind);
  Window.graphVent.options.scales['y'].ticks.display = showWind;
  Window.graphVent.options.scales['y'].grid.display = showWind;

  newValue = document.getElementById("showPressU").checked;
  if (newValue != showPressU) {
    showPressU = newValue;
    localStorage.setItem("showPressU", showPressU);
  }
  Window.graphVent.setDatasetVisibility(2, showPressU);

  // Graphique inférieurs
  newValue = document.getElementById("showT1").checked;
  if (newValue != showT1) {
    showT1 = newValue;
    localStorage.setItem("showT1", showT1);
  }
  Window.graphTemp.setDatasetVisibility(0, showT1);
  Window.graphTemp.setDatasetVisibility(1, showT1);

  newValue = document.getElementById("showPressL").checked;
  if (newValue != showPressL) {
    showPressL = newValue;
    localStorage.setItem("showPressL", showPressL);
  }
  Window.graphTemp.setDatasetVisibility(4, showPressL);

  newValue = document.getElementById("showT2").checked;
  if (newValue != showT2) {
    showT2 = newValue;
    localStorage.setItem("showT2", showT2);
  }
  showT2 = document.getElementById("showT2").checked; 
  Window.graphTemp.setDatasetVisibility(2, showT2);
  Window.graphTemp.setDatasetVisibility(3, showT2);

  // Grilles de pression athmosphérique
  newValue = document.getElementById("showPressGrid").checked;
  if (newValue != showPressGrid) {
    showPressGrid = newValue;
    localStorage.setItem("showPressGrid", showPressGrid);
  }
  Window.graphVent.options.scales['y1'].ticks.display = showPressGrid;
  Window.graphVent.options.scales['y1'].grid.display  = showPressGrid;
  Window.graphTemp.options.scales['y1'].ticks.display = showPressGrid;
  Window.graphTemp.options.scales['y1'].grid.display  = showPressGrid;

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
      tmpSSID    = netListe[i].getElementsByTagName("SSID")[0].childNodes[0].nodeValue;
      tmpChannel = netListe[i].getElementsByTagName("channel")[0].childNodes[0].nodeValue;
      tmpRSSI    = netListe[i].getElementsByTagName("RSSI")[0].childNodes[0].nodeValue;
      tmpCrypt   = netListe[i].getElementsByTagName("encryption")[0].childNodes[0].nodeValue;
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
      htmlNetworkTable += "      <tr class=\"trlink\" onclick=\"wifi_connect('" + tmpSSID + "' , '" + tmpChannel + "')\">\n";
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

async function wifi_connect(SSID, channel) {
  // TODO saisie du mot de passe et confirmation 
  // TODO voir pourquoi on ne reçois pas de réponse XML
  // ? le serveur perd les infos du client lors de la déconnexion ?
  var pwd = "";

  var ssid_input = document.getElementById("ssid_input");
  var pwd_input  = document.getElementById("pwd_input");
  var divWait    = document.getElementById("attente0");
  var btnConnect = document.getElementById("btnConnect");
  var btnAnnuler = document.getElementById("btnAnnuler");

  ssid_input.value = SSID + " (ch." + channel + ")";
  
  connectOK = true;
  suiteOK = false;

  // Affiche la boite de dialogue de saisie du mot de passe réseau
  afficheDialog('dlgConnect');
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
    // Lance la connexion de la balance
    //alert("XMLHttpRequest_post_wificonnect(" + SSID + ", " + pwd + ", " + channel + ");");
    XMLHttpRequest_post_wificonnect(SSID, pwd, channel);
    // On fermera la boite de dialogue et on masquera
    // l'animation d'attente dans 10 secondes
    setTimeout(function() { divWait.classList.add("noshow"); }, 10000);
    setTimeout(function() { closeDialog('dlgConnect'); }, 10000);
  } else {
    alert("Canceled connection.");
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

function toggleFullscreen() {
  if (!isFullScreen) {
    openFullscreen();
    isFullScreen = true;
    document.getElementById("fullScreenButton").innerText = "Close full screen";
  } else {
    closeFullscreen();
    isFullScreen = false;
    document.getElementById("fullScreenButton").innerText = "View in full screen";
  }
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
  // Redimentionnement des graphiques en fonction de la page
  height = window.innerHeight;
  width  = window.innerWidth;
  //alert(width + "\n" + height);
  document.getElementById("lapage").style.height = height + "px";
  document.getElementById("lapage").style.width = width + "px";
}
document.addEventListener("fullscreenchange", fullscreenchanged);

function inputLargeurVent() {
  // Affiche la largeur de calcul de la moyenne vent
  var lbl = document.getElementById("valMoyVent");
  var newVal = document.getElementById("lMoyVent").value;
  secondes = newVal * 30;
  lbl. innerText = new Date(secondes * 1000).toISOString().substring(15, 19);
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

function inputLargeurTemp() {
  // Affiche la largeur de calcul de la moyenne vent
  var lbl = document.getElementById("valMoyTemp");
  var newVal = document.getElementById("lMoyTemp").value;
  secondes = newVal * 30;
  lbl. innerText = new Date(secondes * 1000).toISOString().substring(15, 19);
}

function changeLargeurTemp() {
  // Modifie la largeur de calcul de la moyenne température
  var newVal = document.getElementById("lMoyTemp").value 
  largeurMoyTemp = newVal * 60;
  delete tblTemp;
  tblTemp          = new Array(largeurMoyTemp);
  tblTempIdx       = 0;
  largeurTempFull  = false;
  bmp180Total      = 0.0;
  bmp180Moyen      = 0.0;
  delete tblCtn;
  tblCtn           = new Array(largeurMoyTemp);
  ctnTotal         = 0.0;
  ctnMoyen         = 0.0;
  // Efface les moyennes précédentes
  Window.graphTemp.data.datasets[1].data = [];
  Window.graphTemp.data.datasets[3].data = [];
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

function toogleShowPasswd() {
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
  localStorage.clear();
  window.location.reload();
}







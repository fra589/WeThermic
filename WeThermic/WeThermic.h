/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2024-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: WeThermic.h is part of WeThermic                              */
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

#ifndef WeThermic_h
  #define WeThermic_h

  #define DEBUG
  //#define DEBUG_INTERRUPT
  //#define DEBUG2
  //#define DEBUG3
  //#define DEBUG_PROBE
  #define DEBUG_WEB

  #include <EEPROM.h>
  #include <ESP8266WiFi.h>
  #include <ESP8266mDNS.h>
  #include <ESP8266WebServer.h>
  #include <DNSServer.h>
  #include <LittleFS.h>
  #include <Adafruit_SSD1306.h>
  #include <SFE_BMP180.h>

  #include "WeThermicLogo.h"
  #include "eeprom.h"
  #include "wwwifi.h"
  #include "webserver.h"
  #include "affichage.h"
  #include "sfe_bmp180.h"
  #include "thermistance.h"

  #define ORG_NAME              "fra589"
  #define COPYRIGHT             "G.Brière 2024-2024"
  #define APP_NAME              "WeThermic"
  #define APP_VERSION_MAJOR     "0"
  #define APP_VERSION_MINOR     "2"
  #define APP_VERSION_DATE      "20240506"
  #define APP_VERSION_STRING    "v" APP_VERSION_MAJOR "." APP_VERSION_MINOR "." APP_VERSION_DATE
  #define APP_NAME_VERSION      APP_NAME " - " APP_VERSION_STRING "\0"

  // Paramètres mesure du vent
  #define HALL_PIN D5 // Entrée numérique esp8266
  #define DUREE 500   // Durée de comptage RPM (ms)
  #define COEF_VENT 0.245
  extern volatile uint32_t pulse;
  extern float vent;
  
  // Mesure température et pression
  extern float tempBmp180;
  extern float pression;
  // Thermistor
  #define CTN_PIN A0
  extern float tempCtn;

  // Stockage 5 minutes de mesures :
  // Taille du tableau pour stocker toute les mesure pendant 
  // 5 minutes avec un interval de "DUREE" millisecondes.
  #define DUREE_HISTORIQUE 600 // ( 5 * 60 / ( DUREE / 1000 ) )
  extern float histVent[DUREE_HISTORIQUE];
  extern float histBmp180[DUREE_HISTORIQUE];
  extern float histPression[DUREE_HISTORIQUE];
  extern float histTempCtn[DUREE_HISTORIQUE];
  extern uint32_t idxHistorique;

  // Paramètres WiFi 
  #define DEFAULT_CLI_SSID   ""           // SSID client (la balance se connecte si défini)
  #define DEFAULT_CLI_PWD    ""           // WPA-PSK/WPA2-PSK client
  #define DEFAULT_AP_SSID    "WeThermic_" // SSID de l'AP balance
  #define DEFAULT_AP_PWD     ""           // WPA-PSK/WPA2-PSK AP
  #define DEFAULT_AP_CHANNEL 3

  // Variable globales pour le WiFi
  #define MAX_SSID_LEN 32 // Longueur maxi d'un SSID
  #define MAX_PWD_LEN  63 // Longueur maxi des mots de passe WiFi
  extern char cli_ssid[MAX_SSID_LEN];
  extern char cli_pwd[MAX_PWD_LEN];
  extern char ap_ssid[MAX_SSID_LEN];
  extern char ap_pwd[MAX_PWD_LEN];

  // Adresses EEProm pour sauvegarde des paramètres
  #define EEPROM_LENGTH 512
  #define ADDR_CLI_SSID        0 //   0 + 32 =  32
  #define ADDR_CLI_PWD        32 //  32 + 63 =  95


  // Web server
  extern ESP8266WebServer server;
  
  // DNS server
  extern DNSServer dnsServer;
  #define DNS_PORT 53
  
  // hostname pour mDNS. devrait fonctionner au moins avec windows :
  // http://WeThermic.local
  extern const char *myHostname;

  // Fichiers web
  #define ROOT_FILE "/index.html"

#endif

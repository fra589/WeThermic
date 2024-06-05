/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2024-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: wwwifi.cpp is part of WeThermic                               */
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

#include "WeThermic.h"

#ifdef DEBUG
  // Prise en charge des évennements
  WiFiEventHandler stationConnectedHandler;
  WiFiEventHandler stationDisconnectedHandler;
  WiFiEventHandler probeRequestPrintHandler;
  
  void onStationConnected(const WiFiEventSoftAPModeStationConnected& evt) {
    Serial.print("Station connected: ");
    Serial.print(macToString(evt.mac));
    Serial.print(" aid = ");
    Serial.println(evt.aid);
  }

  void onStationDisconnected(const WiFiEventSoftAPModeStationDisconnected& evt) {
    Serial.print("Station disconnected: ");
    Serial.println(macToString(evt.mac));
  }
#endif
#ifdef DEBUG_PROBE
  void onProbeRequestPrint(const WiFiEventSoftAPModeProbeRequestReceived& evt) {
    Serial.print("Probe request from: ");
    Serial.print(macToString(evt.mac));
    Serial.print(" RSSI: ");
    Serial.println(evt.rssi);
  }
#endif

void wifiApInit(void) {

  // Soft AP network parameters
  IPAddress apIP(10, 10, 10, 10);
  IPAddress netMsk(255, 255, 255, 0);

  if (strcmp(ap_ssid, DEFAULT_AP_SSID) == 0) {
    String SSID_MAC = String(DEFAULT_AP_SSID + WiFi.softAPmacAddress().substring(9));
    SSID_MAC.toCharArray(ap_ssid, MAX_SSID_LEN);
  }

  // Ouverture access point
  #ifdef DEBUG
    Serial.print("\nConfiguring access point, SSID = <");
    Serial.print(ap_ssid);
    Serial.println(">");
    Serial.flush();
  #endif

  WiFi.softAPConfig(apIP, apIP, netMsk);
  WiFi.softAP(ap_ssid, ap_pwd, DEFAULT_AP_CHANNEL); // (AP ouverte si de mot de passe vide ou null)

  delay(500); // Without delay I've seen the IP address blank

  #ifdef DEBUG
    Serial.print("AP SSID:       <");
    Serial.print(WiFi.softAPSSID());
    Serial.println(">");
    Serial.print("AP IP address: ");
    Serial.println(WiFi.softAPIP());
    Serial.printf("AP MAC address = %s\n", WiFi.softAPmacAddress().c_str());
    Serial.printf("Wifi channel = %d\n", WiFi.channel());
    Serial.flush();
    // Register event handlers.
    // Callback functions will be called as long as these handler objects exist.
    // Call "onStationConnected" each time a station connects
    stationConnectedHandler = WiFi.onSoftAPModeStationConnected(&onStationConnected);
    // Call "onStationDisconnected" each time a station disconnects
    stationDisconnectedHandler = WiFi.onSoftAPModeStationDisconnected(&onStationDisconnected);
  #endif
  #ifdef DEBUG_PROBE
    // Call "onProbeRequestPrint" and "onProbeRequestBlink" each time
    // a probe request is received.
    // Former will print MAC address of the station and RSSI to Serial,
    // latter will blink an LED.
    probeRequestPrintHandler = WiFi.onSoftAPModeProbeRequestReceived(&onProbeRequestPrint);
  #endif

  // Setup DNS server pour redirection de tous les domaines 
  // sur l'IP de la balance
  dnsServer.setErrorReplyCode(DNSReplyCode::NoError);
  dnsServer.start(DNS_PORT, "*", apIP);

}

void wifiClientInit(void) {

  uint32_t debut;
  
  // Empeche le wifi client de se connecter avec d'anciens paramètres résiduels en EEPROM.
  WiFi.setAutoConnect(false);
  WiFi.setAutoReconnect (false );
  // Connexion à un Acces Point si SSID défini
  if (cli_ssid[0] != '\0') {
    #ifdef DEBUG
      Serial.println("");
      Serial.print("Connexion à "); Serial.println(cli_ssid);
      Serial.flush();
    #endif
    debut = millis();
    WiFi.begin(cli_ssid, cli_pwd);
    while (WiFi.status() != WL_CONNECTED) {
      delay(250);
      #ifdef DEBUG
        Serial.print(".");
        Serial.flush();
      #endif
      if (millis() - debut > 10000) {
        break; // Timeout = 10 secondes
      }
    }
    if(WiFi.status() == WL_CONNECTED) {
      #ifdef DEBUG
          Serial.println("OK");
          Serial.print("IP = ");
          Serial.println(WiFi.localIP());
      #endif
      WiFi.setAutoReconnect(true);
      //Start mDNS with APP_NAME
      if (MDNS.begin(myHostname, WiFi.localIP())) {
        ;
        #ifdef DEBUG
          Serial.println("MDNS started");
        #endif
      } else {
        ;
        #ifdef DEBUG
          Serial.println("MDNS failed");
        #endif
      }
    } else {
      ;
      #ifdef DEBUG
        Serial.print("FAIL, WiFi.status() = ");
        Serial.println(getWiFiStatus(WiFi.status()));
        switch (WiFi.status()) {
          case WL_IDLE_STATUS:
            Serial.println("Erreur : Wi-Fi is in process of changing between statuses");
          break;
          case WL_NO_SSID_AVAIL:
            Serial.println("Erreur : SSID cannot be reached");
          break;
          case WL_CONNECT_FAILED:
            Serial.println("Erreur : Connexion failed");
          break;
          case WL_WRONG_PASSWORD:
            Serial.println("Erreur : Password is incorrect");
          break;
          case WL_DISCONNECTED:
            Serial.println("Erreur : Module is not configured in station mode");
          break;
        }
      #endif
    } 
  }

}

String macToString(const unsigned char* mac) {
  char buf[18];
  snprintf(buf, sizeof(buf), "%02x:%02x:%02x:%02x:%02x:%02x", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

// Is this an IP?
bool isIp(String str) {
  for (size_t i = 0; i < str.length(); i++) {
    int c = str.charAt(i);
    if (c != '.' && (c < '0' || c > '9')) {
      return false;
    }
  }
  return true;
}

// IP to String.
String IPtoString(IPAddress ip) {
  String res = "";
  for (int i = 0; i < 3; i++) {
    res += String((ip >> (8 * i)) & 0xFF) + ".";
  }
  res += String((ip >> (8 * 3)) & 0xFF);
  return res;
}

// renvoie en format XML la liste des SSID scannés 
String getWifiNetworks() {
  String XML = "";
  int nReseaux;
  int i;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans getWifiNetworks()\n");
  #endif

// Voir https://arduino-esp8266.readthedocs.io/en/latest/esp8266wifi/scan-examples.html#scan
//WiFi.mode(WIFI_STA);
//WiFi.disconnect();
// https://randomnerdtutorials.com/esp8266-nodemcu-wi-fi-manager-asyncwebserver/

  if(WiFi.isConnected()) {
    XML += "  <activeNetwork>\n";
    XML += "    <SSID>";
    XML += WiFi.SSID();
    XML += "</SSID>\n";
    XML += "    <PSK>";
    XML += WiFi.psk();
    XML += "</PSK>\n";
    XML += "    <RSSI>";
    XML += WiFi.RSSI();
    XML += "</RSSI>\n";
    XML += "    <channel>";
    XML += WiFi.channel();
    XML += "</channel>\n";
    XML += "    <localip>";
    XML += IPtoString(WiFi.localIP());
    XML += "</localip>\n";
    XML += "  </activeNetwork>\n";
  }

  nReseaux = WiFi.scanNetworks();
  for (i = 0; i < nReseaux; i++) {
    XML += "  <network>\n";
    XML += "    <SSID>";
    XML += WiFi.SSID(i);
    XML += "</SSID>\n";
    XML += "    <channel>";
    XML += WiFi.channel(i);
    XML += "</channel>\n";
    XML += "    <RSSI>";
    XML += WiFi.RSSI(i);
    XML += "</RSSI>\n";
    XML += "    <encryption>";
    switch (WiFi.encryptionType(i)) {
      case (ENC_TYPE_NONE):
        XML += "none";
        break;
      case (ENC_TYPE_WEP):
        XML += "WEP";
        break;
      case (ENC_TYPE_TKIP):
        XML += "WPA-PSK";
        break;
      case (ENC_TYPE_CCMP):
        XML += "WPA2-PSK";
        break;
      case (ENC_TYPE_AUTO):
        XML += "Auto";
        break;
      default:
        XML += "Inconnue";
    }
    XML += "</encryption>\n";
    XML += "  </network>\n";
  }
  WiFi.scanDelete();

  return XML;

}

String getWiFiStatus(wl_status_t wifiStatus) {
 
  switch (wifiStatus) {
    case WL_NO_SHIELD:
      return(String("WL_NO_SHIELD"));
      break;
    case WL_IDLE_STATUS:
      return(String("WL_IDLE_STATUS"));
      break;
    case WL_NO_SSID_AVAIL:
      return(String("WL_NO_SSID_AVAIL"));
      break;
    case WL_SCAN_COMPLETED:
      return(String("WL_SCAN_COMPLETED"));
      break;
    case WL_CONNECTED:
      return(String("WL_CONNECTED"));
      break;
    case WL_CONNECT_FAILED:
      return(String("WL_CONNECT_FAILED"));
      break;
    case WL_CONNECTION_LOST:
      return(String("WL_CONNECTION_LOST"));
      break;
    case WL_WRONG_PASSWORD:
      return(String("WL_WRONG_PASSWORD"));
      break;
    case WL_DISCONNECTED:
      return(String("WL_DISCONNECTED"));
      break;
  }
  return(String(wifiStatus));
}

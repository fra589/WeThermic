/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2024-2025 Gauthier Brière (gauthier.briere "at" gmail.com) */
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
  int ssid_hidden = 0; // 1 pour masquer le SSID
  int max_connection = 4; // 8 au maximum possible, 4 max préconisé pour les perfos et la stabilité
  
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
  WiFi.softAP(ap_ssid, ap_pwd, DEFAULT_AP_CHANNEL, ssid_hidden, max_connection); // (AP ouverte si de mot de passe vide ou null)

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
  WiFiPhyMode_t mode;
  
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
      if (millis() - debut > 15000) {
        break; // Timeout = 15 secondes
      }
    }
    if(WiFi.status() == WL_CONNECTED) {
      #ifdef DEBUG
          Serial.println("Connexion OK");
          Serial.print("IP = ");
          Serial.println(WiFi.localIP());
          Serial.print("Mode = ");
          switch (WiFi.getPhyMode()) {
            case WIFI_PHY_MODE_11B:
              Serial.println("802.11B");
            break;
            case WIFI_PHY_MODE_11G:
              Serial.println("802.11G");
            break;
            case WIFI_PHY_MODE_11N:
              Serial.println("802.11N");
            break;
          }
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
      // Connection failed, on force le mode AP uniquement
      WiFi.mode(WIFI_AP);
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
    #ifdef DEBUG
      switch (WiFi.getMode()) {
        case WIFI_OFF:
          Serial.println("WiFi is off.");
          break;
        case WIFI_STA:
          Serial.println("WiFi is in station mode.");
          break;
        case WIFI_AP:
          Serial.println("WiFi is in AP mode.");
          break;
        case WIFI_AP_STA:
          Serial.println("WiFi is both in station and AP mode.");
          break;
      }
    #endif
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
  // Voir https://arduino-esp8266.readthedocs.io/en/latest/esp8266wifi/scan-examples.html#scan
  // https://randomnerdtutorials.com/esp8266-nodemcu-wi-fi-manager-asyncwebserver/

  String XML = "";
  int nReseaux;
  int i;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans getWifiNetworks()\n");
  #endif

  if(WiFi.isConnected()) {
    #ifdef DEBUG_WEB
      Serial.printf("WiFi.isConnected() = true\n");
    #endif
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
  } else if (cli_ssid[0] != '\0') {
    // Non connecté mais SSID définit
    #ifdef DEBUG_WEB
      Serial.printf("WiFi.isConnected() = false, cli_ssid = %s\n", cli_ssid);
    #endif
    XML += "  <activeNetwork>\n";
    XML += "    <SSID>";
    XML += String(cli_ssid);
    XML += "</SSID>\n";
    XML += "    <PSK>";
    XML += String(cli_pwd);
    XML += "</PSK>\n";
    XML += "    <RSSI/>\n";
    XML += "    <channel/>\n";
    XML += "    <localip>0.0.0.0</localip>\n";
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
    XML += "    <knownPassword>";
    XML += getKnownPassword(WiFi.SSID(i));
    XML += "</knownPassword>\n";
    XML += "  </network>\n";
  }
  WiFi.scanDelete();
  #ifdef DEBUG_WEB
    Serial.printf("getWifiNetworks(): Fin du scan des réseaux WiFi.\n", cli_ssid);
  #endif

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

String getKnownPassword(String ssid) {
  // Retrouve le mot de passe d'un SSID s'il est déja connu
  /* Structure du fichier knownWiFi.xml :
   * <knownWiFi>\n
   * <s>SSID</s><p>PASSWORD</p>\n
   * </knownWiFi>\n
  */
  File pwdFile;
  String ligne, s, p;
  int idx[4];

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans getKnownPassword(%s)\n", ssid.c_str());
  #endif

  if (LittleFS.exists(PWD_FILE)) {
    pwdFile = LittleFS.open(PWD_FILE, "r");
    ligne = pwdFile.readStringUntil('\n');
    if (ligne != "<knownWiFi>") {
      #ifdef DEBUG_WEB
        Serial.printf("Wrong file format!\n");
      #endif
      pwdFile.close();
      return "";
    }
    for (;;) {
      ligne = pwdFile.readStringUntil('\n');
      if (ligne == "</knownWiFi >") {
        // Fin de l'XML, on a pas trouvé de correspondance
        pwdFile.close();
        return "";
      }
      // Vérification de la ligne
      idx[0] = ligne.indexOf("<s>");
      idx[1] = ligne.lastIndexOf("</s>");
      idx[2] = ligne.indexOf("<p>");
      idx[3] = ligne.lastIndexOf("</p>");
      if ((idx[0] == -1) || (idx[1] == -1) || (idx[2] == -1) || (idx[3] == -1)) {
        // Mauvais format de ligne ou dernière ligne, on a pas trouvé de correspondance
        pwdFile.close();
        return "";
      }
      s = ligne.substring(idx[0] + 3, idx[1]);
      if (s == ssid) {
        p = ligne.substring(idx[2] + 3, idx[3]);
        Serial.printf("Password pour [%s] = [%s]\n", s.c_str(), p.c_str());
        pwdFile.close();
        return p;
      }
    }
  } else {
    #ifdef DEBUG_WEB
      Serial.print("[");
      Serial.print(PWD_FILE);
      Serial.println("] not found.");
    #endif
    return "";
  }
}

void updateKnownPassword(String ssid, String password) {
  // Sauvegarde le mot de passe d'un SSID avec ceux déja connu
  /* 
   * Structure du fichier knownWiFi.xml :
   * <knownWiFi>\n
   * <s>SSID</s><p>PASSWORD</p>\n
   * </knownWiFi>\n
  */
  File pwdFile, tmpFile;
  String ligne, s, p;
  int idx[4];
  bool ssidTrouve = false;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans updateKnownPassword(%s)\n", ssid.c_str());
  #endif

  pwdFile = LittleFS.open(PWD_FILE, "r");
  ligne = pwdFile.readStringUntil('\n');
  if (ligne != "<knownWiFi>") {
    // Wrong file format
    pwdFile.close();
    return;
  }

  tmpFile = LittleFS.open(TMP_FILE, "w");
  // Recopie la première ligne dans le fichier temporaire
  tmpFile.printf("%s\n", ligne.c_str());
  
  for (;;) {
    ligne = pwdFile.readStringUntil('\n');
    if (ligne == NULL) {
      // Fin de fichier
      break;
    }
    // Vérification de la ligne
    idx[0] = ligne.indexOf("<s>");
    idx[1] = ligne.lastIndexOf("</s>");
    idx[2] = ligne.indexOf("<p>");
    idx[3] = ligne.lastIndexOf("</p>");
    s = ligne.substring(idx[0] + 3, idx[1]);
    if (s == ssid) {
      ssidTrouve = true;
      #ifdef DEBUG_WEB
        Serial.printf("Remplacement du mot de passe de %s par %s\n", ssid.c_str(), password.c_str());
      #endif
      tmpFile.printf("<s>%s</s><p>%s</p>\n", ssid.c_str(), password.c_str());
    } else if (ligne == "</knownWiFi>") {
      if (!ssidTrouve) {
        #ifdef DEBUG_WEB
          Serial.printf("Ajout du mot de passe de %s = %s\n", ssid, password);
        #endif
        tmpFile.printf("<s>%s</s><p>%s</p>\n", ssid.c_str(), password.c_str());
      }
      tmpFile.printf("%s\n", ligne.c_str());
    } else {
      if ((idx[0] == -1) || (idx[1] == -1) || (idx[2] == -1) || (idx[3] == -1)) {
        #ifdef DEBUG_WEB
          Serial.println("Mauvais format de ligne ! => Cloture du fichier de mot de passe");
        #endif
        tmpFile.printf("</knownWiFi>");
        break;
      }
      tmpFile.printf("%s\n", ligne.c_str());
    }
  }

  #ifdef DEBUG_WEB
    Serial.println("Fin du fichier de mot de passe");
  #endif

  pwdFile.close();
  tmpFile.close();

  // Remplace le fichier de mot de passe par le fichier temporaire
  LittleFS.remove(PWD_FILE);
  LittleFS.rename(TMP_FILE, PWD_FILE);
  LittleFS.remove(TMP_FILE);
 
}

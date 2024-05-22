/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: webserver.cpp is part of WeThermic                            */
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

void webServerInit(void) {

  // Montage du système de fichier ou sont stockés les éléments web
  if (!LittleFS.begin()) {
    ;
    #ifdef DEBUG
      Serial.println("Erreur lors du montage du système de fichier LittleFS");
      Serial.flush();
    #endif    
  }

  // Setup web pages
  server.enableCORS(true);
  server.on(ROOT_FILE,           handleRoot); // /index.html
  server.on("/",                 handleRoot);
  server.on("/connecttest.txt",  handleRoot);
  server.on("/generate_204",     handleRoot); //Android captive portal. Maybe not needed. Might be handled By notFound handler.
  server.on("/favicon.ico",      handleRoot); //Another Android captive portal. Maybe not needed. Might be handled By notFound handler. Checked on Sony Handy
  server.on("/fwlink",           handleRoot); //Microsoft captive portal. Maybe not needed. Might be handled By notFound handler.
  server.on("/getvalues",        handleGetValues);
  server.on("/history",          handleGetHistory);
  server.on("/getversion",       handleGetVersion);
  server.on("/getnetworks",      handleGetNetworks);
  server.on("/deconnexion",      handleDeconnection);
  server.on("/wificonnect",      handleWifiConnect);
  server.onNotFound(handleNotFound);
  server.begin(); // Start http web server
  
  yield();
  delay(500);

  #ifdef DEBUG
    Serial.println("Serveur web démarré.");
    Serial.flush();
  #endif    

}

// Redirection vers le portail captif en cas de requette vers un autre domaine
// retourne true dans ce cas pour éviter que la page ne renvoie plusieurs fois
// la requette.
bool captivePortal(void) {

  if (!isIp(server.hostHeader()) && server.hostHeader() != (String(myHostname) + ".local")) {
    #ifdef DEBUG_WEB
      Serial.println("Redirection vers le portail captif");
    #endif
    server.sendHeader("Location", String("http://") + IPtoString(server.client().localIP()) + "/index.html", true);
    server.send(302, "text/plain", "");   // Empty content inhibits Content-length header so we have to close the socket ourselves.
    server.client().stop(); // Stop is needed because we sent no content length
    return true;
  }

  return false;

}

//Handles http request 
void handleRoot(void) {

  String buffer = "";
  File file;

  #ifdef DEBUG_WEB
    Serial.println("Entrée dans handleRoot()");
    Serial.print("server.hostHeader() = ");
    Serial.println(server.hostHeader());
    String uri = ESP8266WebServer::urlDecode(server.uri()); 
    Serial.print("server.uri() = ");
    Serial.println(uri);
  #endif

  if (captivePortal()) { // If caprive portal redirect instead of displaying the page.
    return;
  }

  #ifdef DEBUG_WEB
    Serial.println("captivePortal() returned false, sending index.html");
  #endif

  handleFileRead("/index.html");

}

void handleNotFound(void) {

  #ifdef DEBUG_WEB
    Serial.print("Entrée dans handleNotFound() ");
  #endif

  String uri = ESP8266WebServer::urlDecode(server.uri());  // required to read paths with blanks

  #ifdef DEBUG_WEB
    Serial.printf("- uri = %s\n", uri.c_str());
  #endif

  // Cherche le fichier sur LittleFS
  if (handleFileRead(uri)) {
    return;
  }

  String message = F("Page non trouvée : ");
  message += server.uri().c_str();
  message += F("\n");

  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "-1");
  server.send(404, "text/plain", message);

}

bool handleFileRead(String path) {
  String contentType;
  File file;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleFileRead(\"%s\")\n", path.c_str());
  #endif

  contentType = mime::getContentType(path);

  if (LittleFS.exists(path)) {
    #ifdef DEBUG_WEB
      Serial.printf("LittleFS.exists(\"%s\") OK.\n", path.c_str());
    #endif
    file = LittleFS.open(path, "r");
    if (server.streamFile(file, contentType) != file.size()) {
      ;
      #ifdef DEBUG_WEB
      Serial.println("Sent less data than expected!");
      #endif
    }
    file.close();
    return true;
  #ifdef DEBUG_WEB
  } else {
    Serial.printf("LittleFS.exists(\"%s\") returned false !\n", path.c_str());
  #endif
  }

  return false;

}

void handleGetValues(void) {

  String XML;

  digitalWrite(LED_BUILTIN, LOW); // Allume la LED

  #ifdef DEBUG_WEB_VALUE
    Serial.printf("Entrée dans handleGetValues() --- %d\n", millis()/1000);
  #endif

  // Renvoi la réponse au client http
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  XML += F("<valeurs>\n");
  XML += F("  <vent>");
  XML += String(vent);
  XML += F("  </vent>\n");
  XML += F("  <temperature>");
  XML += String(tempBmp180);
  XML += F("  </temperature>\n");
  XML += F("  <pression>");
  XML += String(pression);
  XML += F("  </pression>\n");
  XML += F("  <tempctn>");
  XML += String(tempCtn);
  XML += F("  </tempctn>\n");
  XML += F("</valeurs>\n");

  server.send(200,"text/xml",XML);
  
  digitalWrite(LED_BUILTIN, HIGH); // Eteint la LED

}

void handleGetHistory(void) {

  int i;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetHistory()\n");
  #endif

  // Renvoi la réponse au client http
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "-1");
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "text/xml", "");
  server.sendContent (F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n"));
  server.sendContent (F("<history>\n"));
  server.sendContent (F("  <history_len>\n"));
  server.sendContent (String(DUREE_HISTORIQUE));
  server.sendContent (F("</history_len>\n"));
  for (i = idxHistorique; i < DUREE_HISTORIQUE; i++) {
    server.sendContent (F("  <hist>"));
    server.sendContent (F("    <vent>"));
    server.sendContent (String(histVent[i]));
    server.sendContent (F("</vent>"));
    server.sendContent (F("  <tempctn>"));
    server.sendContent (String(histTempCtn[i]));
    server.sendContent (F("</tempctn>\n"));
    server.sendContent (F("    <tbmp180>"));
    server.sendContent (String(histBmp180[i]));
    server.sendContent (F("</tbmp180>\n"));
    server.sendContent (F("    <press>"));
    server.sendContent (String(histPression[i]));
    server.sendContent (F("</press>\n"));
    server.sendContent (F("  </hist>\n"));
  }
  for (i = 0; i < idxHistorique; i++) {
    server.sendContent (F("  <hist>"));
    server.sendContent (F("    <vent>"));
    server.sendContent (String(histVent[i]));
    server.sendContent (F("</vent>"));
    server.sendContent (F("  <tempctn>"));
    server.sendContent (String(histTempCtn[i]));
    server.sendContent (F("</tempctn>\n"));
    server.sendContent (F("    <tbmp180>"));
    server.sendContent (String(histBmp180[i]));
    server.sendContent (F("</tbmp180>\n"));
    server.sendContent (F("    <press>"));
    server.sendContent (String(histPression[i]));
    server.sendContent (F("</press>\n"));
    server.sendContent (F("  </hist>\n"));
  }
  server.sendContent (F("</history>\n"));
  server.sendContent("");

  server.client().stop(); // Stop is needed because we sent no content length

  #ifdef DEBUG_WEB
    Serial.printf("Sortie de handleGetHistory()\n");
  #endif

}

void handleGetHistory_old(void) {

  int i;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetHistory()\n");
  #endif

  // Renvoi la réponse au client http
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "-1");
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "text/xml", "");
  server.sendContent (F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n"));
  server.sendContent (F("<history>\n"));
  #ifdef DEBUG_WEB
    Serial.printf("  Envoi historique vent...\n");
  #endif
  for (i = idxHistorique; i < DUREE_HISTORIQUE; i++) {
    server.sendContent (F("  <histvent>"));
    server.sendContent (String(histVent[i]));
    server.sendContent (F("</histvent>\n"));
  }
  for (i = 0; i < idxHistorique; i++) {
    server.sendContent (F("  <histvent>"));
    server.sendContent (String(histVent[i]));
    server.sendContent (F("</histvent>\n"));
  }
  #ifdef DEBUG_WEB
    Serial.printf("  Envoi historique température CTN...\n");
  #endif
  for (i = idxHistorique; i < DUREE_HISTORIQUE; i++) {
    server.sendContent (F("  <histtempctn>"));
    server.sendContent (String(histTempCtn[i]));
    server.sendContent (F("</histtempctn>\n"));
  }
  for (i = 0; i < idxHistorique; i++) {
    server.sendContent (F("  <histtempctn>"));
    server.sendContent (String(histTempCtn[i]));
    server.sendContent (F("</histtempctn>\n"));
  }
  #ifdef DEBUG_WEB
    Serial.printf("  Envoi historique température BMP180...\n");
  #endif
  for (i = idxHistorique; i < DUREE_HISTORIQUE; i++) {
    server.sendContent (F("  <histbmp180>"));
    server.sendContent (String(histBmp180[i]));
    server.sendContent (F("</histbmp180>\n"));
  }
  for (i = 0; i < idxHistorique; i++) {
    server.sendContent (F("  <histbmp180>"));
    server.sendContent (String(histBmp180[i]));
    server.sendContent (F("</histbmp180>\n"));
  }
  #ifdef DEBUG_WEB
    Serial.printf("  Envoi historique pression...\n");
  #endif
  for (i = idxHistorique; i < DUREE_HISTORIQUE; i++) {
    server.sendContent (F("  <histpression>"));
    server.sendContent (String(histPression[i]));
    server.sendContent (F("</histpression>\n"));
  }
  for (i = 0; i < idxHistorique; i++) {
    server.sendContent (F("  <histpression>"));
    server.sendContent (String(histPression[i]));
    server.sendContent (F("</histpression>\n"));
  }
  server.sendContent (F("</history>\n"));

  #ifdef DEBUG_WEB
    Serial.printf("  avant client().stop()...\n");
  #endif
  server.sendContent("");
  server.client().stop(); // Stop is needed because we sent no content length

  #ifdef DEBUG_WEB
    Serial.printf("Sortie de handleGetHistory()\n");
  #endif

}

void handleGetVersion(void) {

  String XML;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetVersion() --- %d\n", millis()/1000);
  #endif

  // Renvoi la réponse au client http
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  XML += F("<version>\n");
  XML += F("  <app>");
  XML += String(APP_NAME);
  XML += F("  </app>\n");
  XML += F("  <major>");
  XML += String(APP_VERSION_MAJOR);
  XML += F("  </major>\n");
  XML += F("  <minor>");
  XML += String(APP_VERSION_MINOR);
  XML += F("  </minor>\n");
  XML += F("  <date>");
  XML += String(APP_VERSION_DATE);
  XML += F("  </date>\n");
  XML += F("  <string>");
  XML += String(APP_VERSION_STRING);
  XML += F("  </string>\n");
  XML += F("</version>\n");

  server.send(200,"text/xml",XML);

}

void handleGetNetworks(void) {
  String XML;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetNetworks() --- %d\n", millis()/1000);
  #endif

  // Renvoi la réponse au client http
  XML  =F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  XML += "<networks>\n";
  XML += getWifiNetworks();
  XML += "</networks>\n";

  server.send(200,"text/xml",XML);
  
}

void handleDeconnection(void) {
  String XML;
  int i;
  
  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleDeconnection() --- %d\n", millis()/1000);
  #endif

  // Deconnexion du réseau
  if (WiFi.status() == WL_CONNECTED) {
    // Si on est déjà connecté, on coupe, sinoni il n'y a rien a faire...
    #ifdef DEBUG_WEB
      Serial.printf("  handleWifiConnect() - déconnexion du réseau précédent\n");
      Serial.flush();
    #endif
    WiFi.disconnect();
  }

  //Effacement des données réseau
  for (i=0; i<MAX_SSID_LEN; i++) {
    cli_ssid[i] = '\xFF';
  }
  for (i=0; i<MAX_PWD_LEN; i++) {
    cli_pwd[i] = '\xFF';
  }
  // Sauvegarde les nouveaux paramètres dans l'EEPROM
  EEPROM_writeStr(ADDR_CLI_SSID, cli_ssid, MAX_SSID_LEN);
  EEPROM_writeStr(ADDR_CLI_PWD, cli_pwd, MAX_PWD_LEN);
  EEPROM.commit();
  
  // Réponse au client
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  //XML +=F("<?xml-stylesheet href=\"style.css\" type=\"text/css\"?>\n");
  XML += F("<deconnexion>\n");
  XML += F("  <result>OK</result>\n");
  XML += F("</deconnexion>\n");

  // Renvoi la réponse au client http
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200,"text/xml",XML);

}

void handleWifiConnect(void) {
  String XML;
  String ssid        = "";
  String password    = "";
  int8_t channel     = 0;
  bool settingChange = false;
  bool newConnectOK  = false;
  String result      = "";
  unsigned long debut = 0;
  
  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleWifiConnect() --- %d\n", millis()/1000);
  #endif

  if (server.args() > 0) {
    //Traitement des données POST
    for (int i = 0; i < server.args(); i++) {
      #ifdef DEBUG_WEB
        Serial.printf("  handleWifiConnect() - Arg n°%d –> %s = [%s]\n", i, server.argName(i), server.arg(i).c_str());
      #endif
      if (strncasecmp(server.argName(i).c_str(), "ssid", (size_t)4) == 0) {
        #ifdef DEBUG_WEB
          Serial.printf("  handleWifiConnect() - SSID = %s\n", server.arg(i).c_str());
        #endif
        if (strncmp(cli_ssid, server.arg(i).c_str(), MAX_SSID_LEN) != 0) {
          strncpy(cli_ssid, server.arg(i).c_str(), MAX_SSID_LEN);
          settingChange = true;
        }
      } else if (strncasecmp(server.argName(i).c_str(), "pwd", (size_t)3) == 0) {
        #ifdef DEBUG_WEB
          Serial.printf("  handleWifiConnect() - pwd  = %s\n", server.arg(i).c_str());
        #endif
        if (strncmp(cli_pwd, server.arg(i).c_str(), MAX_PWD_LEN) != 0) {
          strncpy(cli_pwd, server.arg(i).c_str(), MAX_PWD_LEN);
          settingChange = true;
        }
      } else if (strncasecmp(server.argName(i).c_str(), "channel", (size_t)7) == 0) {
        if (server.arg(i).toInt() > 0) {
          channel = server.arg(i).toInt();
        }
      }
    }

    // Si on est déjà connecté, on coupe...
    if (WiFi.status() == WL_CONNECTED) {
      #ifdef DEBUG_WEB
        Serial.printf("  handleWifiConnect() - déconnexion du réseau précédent\n");
        Serial.flush();
      #endif
      WiFi.disconnect();
    }

    // Connetion au réseau
    debut = millis();
    if (channel > 0) {
      #ifdef DEBUG_WEB
        Serial.printf("  handleWifiConnect() - connexion au réseau SSID = [%s] pwd=[%s] channel=%d\n", cli_ssid, cli_pwd, channel);
        Serial.flush();
      #endif
      WiFi.begin(cli_ssid, cli_pwd, channel);
    } else {
      #ifdef DEBUG_WEB
        Serial.printf("  handleWifiConnect() - connexion au réseau SSID = [%s] pwd=[%s]\n", cli_ssid, cli_pwd);
        Serial.flush();
      #endif
      WiFi.begin(cli_ssid, cli_pwd);
    }
    while (WiFi.status() != WL_CONNECTED) {
      delay(500);
      #ifdef DEBUG_WEB
        Serial.print(".");
        Serial.flush();
      #endif
      if (millis() - debut > 10000) {
        break; // Timeout = 10 secondes
      }
    }

    // Vérification du résultat
    switch (WiFi.status()) {
      case WL_CONNECTED:
        // Connexion OK
        result = "OK";
        newConnectOK = true;
        #ifdef DEBUG_WEB
            Serial.println(result);
            Serial.printf("IP = %s\n",IPtoString(WiFi.localIP()).c_str());
        #endif
        WiFi.setAutoReconnect(true);
        //Start mDNS with APP_NAME
        if (MDNS.begin(myHostname, WiFi.localIP())) {
          ;
          #ifdef DEBUG_WEB
            Serial.println("MDNS started");
          #endif
        } else {
          ;
          #ifdef DEBUG_WEB
            Serial.println("MDNS failed");
          #endif
        }
        break;
      case WL_IDLE_STATUS:
        result = "Erreur : Wi-Fi is in process of changing between statuses";
        newConnectOK = false;
        #ifdef DEBUG_WEB
          Serial.println(result);
        #endif
      break;
      case WL_NO_SSID_AVAIL:
        result = "Erreur : SSID cannot be reached";
        newConnectOK = false;
        #ifdef DEBUG_WEB
          Serial.println(result);
        #endif
      break;
      case WL_CONNECT_FAILED:
        result = "Erreur : Connexion failed";
        newConnectOK = false;
        #ifdef DEBUG_WEB
          Serial.println(result);
        #endif
      break;
      case WL_WRONG_PASSWORD:
        result = "Erreur : Password is incorrect";
        newConnectOK = false;
        #ifdef DEBUG_WEB
          Serial.println(result);
        #endif
      break;
      case WL_DISCONNECTED:
        result = "Erreur : Module is not configured in station mode";
        newConnectOK = false;
        #ifdef DEBUG_WEB
          Serial.println(result);
        #endif
      break;
    }

    if ((newConnectOK) && (settingChange)){
      #ifdef DEBUG_WEB
        Serial.printf("Sauvegarde paramètres WiFi en EEPROM : SSID=[%s], pwd=[%s]\n", cli_ssid, cli_pwd);
      #endif
      // Sauvegarde les nouveaux paramètres dans l'EEPROM
      EEPROM_writeStr(ADDR_CLI_SSID, cli_ssid, MAX_SSID_LEN);
      EEPROM_writeStr(ADDR_CLI_PWD, cli_pwd, MAX_PWD_LEN);
      EEPROM.commit();
    }

    // Réponse au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<wificonnect>\n");
    XML += F("  <result>") + result + F("</result>\n");
    XML += F("</wificonnect>\n");

  } else { // if (server.args() > 0)
    // Réponse au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<wificonnect>\n");
    XML += F("  <result>wificonnect: missing parameters!</result>\n");
    XML += F("</wificonnect>\n");
  }
  
  // Renvoi la réponse au client http
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200,"text/xml",XML);

  #ifdef DEBUG_WEB
    Serial.println("Réponse XML envoyée.");
  #endif

}

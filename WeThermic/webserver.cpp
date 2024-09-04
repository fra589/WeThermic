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
  // Désactive le formatage automatique
  LittleFSConfig cfg;
  cfg.setAutoFormat(false);
  LittleFS.setConfig(cfg);
  // Monte le système de fichier
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
  server.on("/getapconfig",      handleGetAPconfig);
  server.on("/setapconfig",      handleSetAPconfig);
  server.on("/reboot",           handleReboot);
  server.on("/fsinfo",           handleFSInfo);
  #ifdef HAVE_SCREEN
    server.on("/wakeup",           handleWakeup);
  #endif
  server.on("/factory",          handleFactory);
  server.on("/setduree",         handleSetDuree);
  
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

  #ifdef GENERATE_204
    if (uri == "/generate_204") {
      generate_204();
      return;
    }
  #endif
  
  if (captivePortal()) { // If captive portal redirect instead of displaying the page.
    return;
  }

  #ifdef DEBUG_WEB
    Serial.println("captivePortal() returned false, sending index.html");
  #endif

  handleFileRead("/index.html");

}

#ifdef GENERATE_204
  void generate_204(void) {

    #ifdef DEBUG_WEB
      Serial.println("Entrée dans generate_204()");
    #endif
    
    server.send(204, "No Content", ""); // Reply for Android captive portal detection
    server.client().stop();             // Stop is needed because we sent no content length
    
  }
#endif

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
  XML += F("<vals>");
  XML += F("<v>");
  XML += String(vent);
  XML += F("</v>");
  XML += F("<c>");
  XML += String(tempCtn);
  XML += F("</c>");
  XML += F("<p>");
  XML += String(pression);
  XML += F("</p>");
  XML += F("</vals>\n");

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
  server.sendContent (F("<d>"));
  server.sendContent (String(duree));
  server.sendContent (F("</d>\n"));
  for (i = idxHistorique; i < DUREE_HISTORIQUE; i++) {
    server.sendContent (F("<h>"));
    server.sendContent (F("<p>"));
    server.sendContent (String(histPression[i]));
    server.sendContent (F("</p>"));
    server.sendContent (F("<v>"));
    server.sendContent (String(histVent[i]));
    server.sendContent (F("</v>"));
    server.sendContent (F("<c>"));
    server.sendContent (String(histTempCtn[i]));
    server.sendContent (F("</c>"));
    server.sendContent (F("</h>\n"));
  }
  for (i = 0; i < idxHistorique; i++) {
    server.sendContent (F("<h>"));
    server.sendContent (F("<p>"));
    server.sendContent (String(histPression[i]));
    server.sendContent (F("</p>"));
    server.sendContent (F("<v>"));
    server.sendContent (String(histVent[i]));
    server.sendContent (F("</v>"));
    server.sendContent (F("<c>"));
    server.sendContent (String(histTempCtn[i]));
    server.sendContent (F("</c>"));
    server.sendContent (F("</h>\n"));
  }
  server.sendContent (F("</history>\n"));
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
  XML += F("</app>\n");
  XML += F("  <major>");
  XML += String(APP_VERSION_MAJOR);
  XML += F("</major>\n");
  XML += F("  <minor>");
  XML += String(APP_VERSION_MINOR);
  XML += F("</minor>\n");
  XML += F("  <date>");
  XML += String(APP_VERSION_DATE);
  XML += F("</date>\n");
  XML += F("  <string>");
  XML += String(APP_VERSION_STRING);
  XML += F("</string>\n");
  XML += F("  <screen>");
  #ifdef HAVE_SCREEN
    XML += F("SSD1306");
  #else
    XML += F("NO");
  #endif
  XML += F("</screen>\n");
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

  #ifdef DEBUG_WEB
    Serial.printf("handleGetNetworks(): réponse envoyée.  %d\n", millis()/1000);
    Serial.println("----------");
    Serial.println(XML);
    Serial.println("----------");
  #endif

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
      // Mémorise le mot de passe
      updateKnownPassword(cli_ssid, cli_pwd);
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

void handleGetAPconfig(void) {

  String XML;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetAPconfig()\n");
  #endif

  // Renvoi la réponse au client http
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  XML += F("<apconfig>\n");
  XML += F("  <ssid>");
  XML += String(ap_ssid);
  XML += F("</ssid>\n");
  XML += F("  <pwd>");
  XML += String(ap_pwd);
  XML += F("</pwd>\n");
  XML += F("</apconfig>\n");

  server.send(200,"text/xml",XML);
  
}

void handleSetAPconfig(void) {

  String XML;
  String ssid        = "";
  String password    = "";
  bool settingChange = false;
  
  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleSetAPconfig() --- %d\n", millis()/1000);
  #endif

  if (server.args() > 0) {
    //Traitement des données POST
    for (int i = 0; i < server.args(); i++) {
      #ifdef DEBUG_WEB
        Serial.printf("  handleSetAPconfig() - Arg n°%d –> %s = [%s]\n", i, server.argName(i), server.arg(i).c_str());
      #endif
      if (strncasecmp(server.argName(i).c_str(), "ssid", (size_t)4) == 0) {
        #ifdef DEBUG_WEB
          Serial.printf("  handleSetAPconfig() - SSID = %s\n", server.arg(i).c_str());
        #endif
        if (strncmp(ap_ssid, server.arg(i).c_str(), MAX_SSID_LEN) != 0) {
          strncpy(ap_ssid, server.arg(i).c_str(), MAX_SSID_LEN);
          settingChange = true;
        }
        // Si SSID vide, on rétabli la valeur par défaut
        if (server.arg(i) == "") {
          String SSID_MAC = String(DEFAULT_AP_SSID + WiFi.softAPmacAddress().substring(9));
          SSID_MAC.toCharArray(ap_ssid, MAX_SSID_LEN);
          #ifdef DEBUG_WEB
            Serial.printf("  handleSetAPconfig() - reset SSID to default: %s\n", ap_ssid);
          #endif
        }
      } else if (strncasecmp(server.argName(i).c_str(), "pwd", (size_t)3) == 0) {
        #ifdef DEBUG_WEB
          Serial.printf("  handleSetAPconfig() - pwd  = %s\n", server.arg(i).c_str());
        #endif
        if (strncmp(ap_pwd, server.arg(i).c_str(), MAX_PWD_LEN) != 0) {
          strncpy(ap_pwd, server.arg(i).c_str(), MAX_PWD_LEN);
          settingChange = true;
        }
      }
    }

    // Reconfigure le point d'accès
    WiFi.softAP(ap_ssid, ap_pwd, DEFAULT_AP_CHANNEL); // (AP ouverte si de mot de passe vide ou null)

    if (settingChange) {
      #ifdef DEBUG_WEB
        Serial.printf(" Sauvegarde paramètres AP en EEPROM : SSID=[%s], pwd=[%s]\n", ap_ssid, ap_pwd);
      #endif
      // Sauvegarde les nouveaux paramètres dans l'EEPROM
      EEPROM_writeStr(ADDR_AP_SSID, ap_ssid, MAX_SSID_LEN);
      EEPROM_writeStr(ADDR_AP_PWD, ap_pwd, MAX_PWD_LEN);
      EEPROM.commit();

    }

    // Réponse au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<setapconfig>\n");
    XML += F("  <result>OK</result>\n");
    XML += F("</setapconfig>\n");

  } else { // if (server.args() > 0)
    // Réponse au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<setapconfig>\n");
    XML += F("  <result>setapconfig: missing parameters!</result>\n");
    XML += F("</setapconfig>\n");
  }
  
  // Renvoi la réponse au client http
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200,"text/xml",XML);

}

void handleReboot(void) {
  // Redirige vers la page d'entrée pour après reboot
  server.sendHeader("Location", String("http://") + IPtoString(server.client().localIP()) + "/index.html", true);
  server.send(302, "text/plain", "");   // Empty content inhibits Content-length header so we have to close the socket ourselves.
  server.client().stop(); // Stop is needed because we sent no content length
  delay(250);
  // Reboot
  ESP.restart();
}

void handleFSInfo(void) {
  String XML;
  FSInfo fs_info;
  
  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetAPconfig()\n");
  #endif

  LittleFS.info(fs_info);

  // Renvoi la réponse au client http
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  XML += F("<FSInfo>\n");
  XML += F("  <totalBytes>");
  XML += String(fs_info.totalBytes);
  XML += F("</totalBytes>\n");
  XML += F("  <usedBytes>");
  XML += String(fs_info.usedBytes);
  XML += F("</usedBytes>\n");
  XML += F("  <blockSize>");
  XML += String(fs_info.blockSize);
  XML += F("</blockSize>\n");
  XML += F("  <pageSize>");
  XML += String(fs_info.pageSize);
  XML += F("</pageSize>\n");
  XML += F("  <maxOpenFiles>");
  XML += String(fs_info.maxOpenFiles);
  XML += F("</maxOpenFiles>\n");
  XML += F("  <maxPathLength>");
  XML += String(fs_info.maxPathLength);
  XML += F("</maxPathLength>\n");
  // Liste les fichiers
  XML += F("  <Files>\n");
  XML += getFileList("/");
  XML += F("  </Files>\n");
  XML += F("</FSInfo>\n");

  server.send(200,"text/xml",XML);

}

String getFileList(String path) {
  // Fonction recursive listage des fichiers
  String liste = "";
  Dir dir;
  File f;

  #ifdef DEBUG_WEB
    Serial.print("getFileList(\"");
    Serial.print(path);
    Serial.println("\")");
  #endif
  
  dir = LittleFS.openDir(path);
  while(dir.next()){
    #ifdef DEBUG_WEB
      Serial.println(dir.fileName());
    #endif
    liste += F("    <File><name>");
    liste += String(path + dir.fileName());
    liste += F("</name><size>");
    liste += String(dir.fileSize());
    liste += F("</size></File>\n");
    if (dir.isDirectory() == true) {
      liste += getFileList(path + dir.fileName() + "/");
    }
    yield();
  }

  return liste;
  
}

#ifdef HAVE_SCREEN
  void handleWakeup(void) {
    
    String XML;
    
    // Réactive l'affichage
    affichage_on = 1;
    wakeupDisplay();
    // Réinitialise le compteur de durée pour la prochaine veille
    debutCompteurVeille = millis();
    
    // Réponse au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<wakeup>\n");
    XML += F("  <result>OK</result>\n");
    XML += F("</wakeup>\n");

    // Renvoi la réponse au client http
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(200,"text/xml",XML);

  }
#endif

void handleFactory(void) {

  String XML;

  resetFactory();
  
  // Réponse au client
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  XML += F("<factory>\n");
  XML += F("  <result>OK</result>\n");
  XML += F("</factory>\n");

  // Renvoi la réponse au client http
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200,"text/xml",XML);

}

void handleSetDuree(void) {

  String XML;
  uint32_t dTmp;
  bool settingChange = false;
  
  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleSetDuree() --- %d\n", millis()/1000);
  #endif

  if (server.args() > 0) {
    //Traitement des données POST
    for (int i = 0; i < server.args(); i++) {
      #ifdef DEBUG_WEB
        Serial.printf("  handleSetDuree() - Arg n°%d –> %s = [%s]\n", i, server.argName(i), server.arg(i).c_str());
      #endif
      if (strncasecmp(server.argName(i).c_str(), "duree", (size_t)4) == 0) {
        dTmp = server.arg(i).toInt();
        #ifdef DEBUG_WEB
          Serial.printf("  handleSetDuree() - durée = %d\n", dTmp);
        #endif
        if ((dTmp == 500) || (dTmp == 1000) || (dTmp == 2000))  {
          if (duree != dTmp) {
            duree = dTmp;
            settingChange = true;
            // Réponse OK au client
            XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
            XML += F("<setduree>\n");
            XML += F("  <result>OK</result>\n");
            XML += F("</setduree>\n");
          }
        } else {
    // Réponse erreur au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<setduree>\n");
    XML += F("  <result>setduree: error, duree must be 500, 1000 or 2000</result>\n");
    XML += F("</setduree>\n");
        }
        break;
      }
    }

    if (settingChange) {
      #ifdef DEBUG_WEB
        Serial.printf(" Sauvegarde paramètre duree en EEPROM : duree = %d\n", duree);
      #endif
      // Sauvegarde les nouveaux paramètres dans l'EEPROM
      EEPROM.put(ADDR_DUREE, duree);
      EEPROM.commit();
    }


  } else { // if (server.args() > 0)
    // Réponse au client
    XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
    XML += F("<setduree>\n");
    XML += F("  <result>setduree: missing parameter!</result>\n");
    XML += F("</setduree>\n");
  }
  
  // Renvoi la réponse au client http
  //server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200,"text/xml",XML);

}

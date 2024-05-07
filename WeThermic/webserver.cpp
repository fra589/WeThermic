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
  server.on(ROOT_FILE,           handleRoot); // index.html => /<en/fr>/index.html
  server.on("/",                 handleRoot);
  server.on("/connecttest.txt",  handleRoot);
  server.on("/generate_204",     handleRoot); //Android captive portal. Maybe not needed. Might be handled By notFound handler.
  server.on("/favicon.ico",      handleRoot); //Another Android captive portal. Maybe not needed. Might be handled By notFound handler. Checked on Sony Handy
  server.on("/fwlink",           handleRoot); //Microsoft captive portal. Maybe not needed. Might be handled By notFound handler.
  server.on("/getvalues",        handleGetValues);
  server.on("/getversion",       handleGetVersion);
  server.onNotFound(handleNotFound);
  
  server.begin(); // Start web server

  ////MDNS.addService("http", "tcp", 80);
  
  delay(1000);

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

  float valeur = 0.0;
  String XML;

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
  XML += String(temperature);
  XML += F("  </temperature>\n");
  XML += F("  <pression>");
  XML += String(pression);
  XML += F("  </pression>\n");
  XML += F("  <tempctn>");
  XML += String(tempCtn);
  XML += F("  </tempctn>\n");
  XML += F("</valeurs>\n");
  //server.sendHeader(" -Allow-Origin", "*");
  server.send(200,"text/xml",XML);
  
}

void handleGetVersion(void) {

  String XML;

  #ifdef DEBUG_WEB
    Serial.printf("Entrée dans handleGetVersion() --- %d\n", millis()/1000);
  #endif

  // Renvoi la réponse au client http
  XML  = F("<?xml version=\"1.0\" encoding=\"UTF-8\"\?>\n");
  //XML += F("<?xml-stylesheet href=\"style.css\" type=\"text/css\"?>\n");
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

  //server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200,"text/xml",XML);

}

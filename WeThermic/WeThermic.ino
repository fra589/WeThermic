/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2024-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: WeThermic.ino is part of WeThermic                            */
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


//----------------------------------------------------------------------------
// Variables globales
//----------------------------------------------------------------------------

// Mesure du vent
long mesure = 0;
bool sup_seuil = false;
uint32_t temps0 = millis();
uint32_t temps1 = millis();
volatile uint32_t pulse = 0;
float vent = 0;
// Mesure températures et pression
double temperature = 0;
double pression = 0;
double tempCtn = 0;
double temperatureCumule;
long   nombreTemperature = 0;

// WiFi
char cli_ssid[MAX_SSID_LEN] = DEFAULT_CLI_SSID;
char cli_pwd[MAX_PWD_LEN]   = DEFAULT_CLI_PWD;
char ap_ssid[MAX_SSID_LEN]  = DEFAULT_AP_SSID;
char ap_pwd[MAX_PWD_LEN]    = DEFAULT_AP_PWD;

// mDNS
const char *myHostname = APP_NAME;

// DNS server
DNSServer dnsServer;

// Web server
ESP8266WebServer server(80);

void IRAM_ATTR hall_ISR() {
  // Interruption du capteur à effet Hall
  if (digitalRead(HALL_PIN) == HIGH) {
    // Interruption front montant
    #ifdef DEBUG_INTERRUPT
      ets_printf("hall_ISR() rising\n");
    #endif
    pulse++;
    //digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  } else {
    // Interruption front descendant
    #ifdef DEBUG_INTERRUPT
      ets_printf("hall_ISR() falling\n");
    #endif
    //digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  }
}

void setup() {
  // Try pushing frequency to 160MHz.
  bool update_cpu_freq = system_update_cpu_freq(160);

  #if defined(DEBUG) || defined(DEBUG_INTERRUPT) || defined(DEBUG2) || defined(DEBUG3) || defined(DEBUG_PROBE) || defined(DEBUG_WEB)
    Serial.begin(115200);
    Serial.setDebugOutput(true);
    Serial.flush();
    Serial.println();
    Serial.flush();
    int cpuFreq = system_get_cpu_freq();
    Serial.printf("\nStarting %s on ESP8266@%dMHz (system_update_cpu_freq(160) = %s)...\n\n", APP_NAME_VERSION, cpuFreq, update_cpu_freq?"true":"false");
    Serial.flush();
  #endif

  // Hardware init
  pinMode(HALL_PIN, INPUT);
  pinMode(CTN_PIN, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  // Init affichage
  affichage_init();
  afficheSplash();

  // Récupération des paramètres EEPROM
  getEepromStartupData();

  // Capteur Température et pression
  bmp180_init();

  // Initialisation du WiFi
  wifiApInit();
  wifiClientInit();

  // Démarrage du serveur web
  webServerInit();

  // Interruptions pour détection Hall
  attachInterrupt(digitalPinToInterrupt(HALL_PIN), hall_ISR, CHANGE);

  //Efface le logo par un scroll vers le haut
  scrollScreen();

}

void loop() {
 
  temps1 = millis();

  // Lecture thermistor CTN
  if (nombreTemperature == 0) {
    temperatureCumule = readCtn();
  } else {
    temperatureCumule += readCtn();
  }
  nombreTemperature++;

  if (temps1 > temps0 + DUREE) {

    // Moyenne thermistor CTN
    tempCtn = temperatureCumule / nombreTemperature;
    nombreTemperature = 0;

    // Lecture du capteur de température et pression
    read_bmp180();

    // Calcul du vent
    vent = pulse * COEF_VENT; // TODO ecrire formule de calcul de la vitesse du vent = f(pulse)
    pulse = 0;
    temps0 = temps1;
    
    // Affichage sur écran
    displayTemp();

    #ifdef DEBUG2
      Serial.print("vent = ");
      Serial.print(vent);
      Serial.print(", temperature BMP180 = ");
      Serial.print(temperature);
      Serial.print("°C, température CTN = ");
      Serial.print(tempCtn);
      Serial.print("°C, pression atmosphérique = ");
      Serial.print(pression);
      Serial.print("mPa");
    #endif
  }

  // Process DNS
  dnsServer.processNextRequest();
  yield();
  delay(5);
  if (WiFi.status() == WL_CONNECTED) {
    MDNS.update();
  }
  yield();
  delay(5);
  // Process HTTP
  server.handleClient();
  yield();
  delay(5);

}

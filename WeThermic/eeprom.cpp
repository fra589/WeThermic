/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2025 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: eeprom.cpp is part of WeThermic                               */
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

void getEepromStartupData(void) {
  // Récupération des paramètres dans l'EEPROM ou de leur valeur par défaut

  char charTmp;
  uint32_t dTmp;

  EEPROM.begin(EEPROM_LENGTH);
  
  charTmp = char(EEPROM.read(ADDR_AP_SSID));
  if (charTmp != 0xFF) {
    ap_ssid[0] = charTmp;
    for (int i=1; i<MAX_SSID_LEN; i++) {
      ap_ssid[i] = char(EEPROM.read(ADDR_AP_SSID + i));
    }
  }
  
  charTmp = char(EEPROM.read(ADDR_AP_PWD));
  if (charTmp != 0xFF) {
    ap_pwd[0] = charTmp;
    for (int i=1; i<MAX_PWD_LEN; i++) {
      ap_pwd[i] = char(EEPROM.read(ADDR_AP_PWD + i));
    }
  }

  charTmp = char(EEPROM.read(ADDR_CLI_SSID));
  if (charTmp != 0xFF) {
    cli_ssid[0] = charTmp;
    for (int i=1; i<MAX_SSID_LEN; i++) {
      cli_ssid[i] = char(EEPROM.read(ADDR_CLI_SSID + i));
    }
  }
  
  charTmp = char(EEPROM.read(ADDR_CLI_PWD));
  if (charTmp != 0xFF) {
    cli_pwd[0] = charTmp;
    for (int i=1; i<MAX_PWD_LEN; i++) {
      cli_pwd[i] = char(EEPROM.read(ADDR_CLI_PWD + i));
    }
  }

  EEPROM.get(ADDR_DUREE, dTmp);
  if ((dTmp == 500) || (dTmp == 1000) || (dTmp == 2000))  {
    duree = dTmp;
  } else {
    duree = DEFAULT_DUREE;
  }

  #ifdef DEBUG
    Serial.printf("ap_ssid................ = %s\n", ap_ssid);
    Serial.printf("ap_pwd................. = %s\n", ap_pwd);
    Serial.printf("cli_ssid............... = %s\n", cli_ssid);
    Serial.printf("cli_pwd................ = %s\n", cli_pwd);
    Serial.printf("duree.................. = %d\n", duree);
  #endif

}

void resetFactory(void) {
  // Reset de tous les paramètres à leur valeur par défaut
  // et reinitialisation EEPROM

  uint32_t defaultDuree = DEFAULT_DUREE;
  
  #ifdef DEBUG
    Serial.printf("Entrée dans resetFactory()\n");
  #endif

  strcpy(ap_ssid,  DEFAULT_AP_SSID);
  strcpy(ap_pwd,   DEFAULT_AP_PWD);
  strcpy(cli_ssid, DEFAULT_CLI_SSID);
  strcpy(cli_pwd,  DEFAULT_CLI_PWD);

  // Sauvegarde en EEPROM
  EEPROM_format(); // On efface tout

  EEPROM_writeStr(ADDR_AP_SSID,  ap_ssid,  MAX_SSID_LEN);
  EEPROM_writeStr(ADDR_AP_PWD,   ap_pwd,   MAX_PWD_LEN);
  EEPROM_writeStr(ADDR_CLI_SSID, cli_ssid, MAX_SSID_LEN);
  EEPROM_writeStr(ADDR_CLI_PWD,  cli_pwd,  MAX_PWD_LEN);
  EEPROM.put(ADDR_DUREE, defaultDuree);

  #ifdef DEBUG
    Serial.printf("  EEPROM.commit()\n");
  #endif
  EEPROM.commit();

}

void EEPROM_format(void) {
  // Efface tout le contenu de l'EEPROM
  
  #ifdef DEBUG
    Serial.printf("  EEPROM_format()\n");
  #endif
  
  for ( int i = 0 ; i < EEPROM_LENGTH ; i++ ) {
    EEPROM.write(i, 0xFF);
  }
  
  EEPROM.commit();
  
}

void EEPROM_writeStr(int address, char *value, int len) {
  // Write string char to eeprom
  
  #ifdef DEBUG
    Serial.printf("  EEPROM_writeStr(%d, \"%s\", %d)\n", address, value, len);
  #endif
  
  for (int i=0; i<len; i++) {
    EEPROM.write(address + i, value[i]);
  }
  
}

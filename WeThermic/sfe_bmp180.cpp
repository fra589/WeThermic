/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: sfe_bmp180.cpp is part of WeThermic                           */
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

// Mesure température et pression
SFE_BMP180 bmp180;
uint8_t _bmp180_OK = 0;

void bmp180_init(void) {
  
  if (bmp180.begin()) {
    #ifdef DEBUG
      Serial.println("BMP180 init success.");
    #endif
    _bmp180_OK = 1;
  } else {
    ;
    #ifdef DEBUG
      Serial.println("BMP180 erreur !");
    #endif
  }

}

// Lecture du capteur de température et pression
void read_bmp180() {
  
  char result;
  double T, P;
  if (_bmp180_OK) {
    // On doit commencer par lire la température
    result = bmp180.startTemperature();
    if (result != 0)   {
      // Attente measure complète:
      delay(result);
      // Lecture de la température
      result = bmp180.getTemperature(T);
      if (result != 0)   {
        #ifdef DEBUG3
          Serial.print("BMP180 Temperature = ");
          Serial.print(T,2);
          Serial.println(" °C");
        #endif
        // La température est lue, on peux lire la pression
        result = bmp180.startPressure(STANDARD_MODE);
        if (result != 0)   {
          // Attente measure complète:
          delay(result);
          // Lecture de la pression
          result = bmp180.getPressure(P,T);
          if (result != 0) {
            ;
            #ifdef DEBUG3
              Serial.print("BMP180 pression absolue = ");
              Serial.print(P,2);
              Serial.println(" hPa");
            #endif
          } else {
            ;
            #ifdef DEBUG3
              Serial.println("BMP180 erreur getPressure() !");
            #endif
          }
        } else {
          ;
          #ifdef DEBUG3
            Serial.println("BMP180 erreur startPressure() !");
          #endif
        }
      } else {
        ;
        #ifdef DEBUG3
          Serial.println("BMP180 erreur getTemperature() !");
        #endif
      }
    } else {
      ;
      #ifdef DEBUG3
        Serial.println("BMP180 erreur startTemperature() !");
      #endif
    }

    temperature = T;
    pression = P;
  }

}

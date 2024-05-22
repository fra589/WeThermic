/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: thermistance.cpp is part of WeThermic                         */
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

// Lecture thermistance 10K B3435 1% MF52B
float readCtn() {

  int t = analogRead(CTN_PIN);
  
  // Résistance du termistor CTN
  float rCtn = (t * R1) / (1023.0F - t);
  #ifdef DEBUG3
    Serial.print("rCtn = ");
    Serial.print(rCtn);
  #endif

  // Source : https://fr.wikipedia.org/wiki/Relation_de_Steinhart-Hart
  // Pour une plage limitée de la température le calcul de la
  // température (en Kelvins) est donné par la formule suivante :
  float T = 1/((log(rCtn / RT0) / B) + (1 / (T0 + C2K)));
  // En °C :
  T = T - C2K;
  
  #ifdef DEBUG3
    Serial.print(", T = ");
    Serial.print(T);
    Serial.println(" °C");
  #endif

  return T;

}

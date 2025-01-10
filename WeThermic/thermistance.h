/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2025 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: thermistance.h is part of WeThermic                           */
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

#ifndef thermistance_h
  #define thermistance_h

  #define R1  10000.0  // Résistance du pont diviseur
  #define T0     25.0  // Température de référence du thermistor CTN
  #define RT0 10000.0  // Résistance thermistore à la température de référence
  #define B    3450    // Constante B du thermistor NTC
  #define C2K   273.15 // Conversion température : T °C = Température en K - C2K

  float readCtn();
  
#endif

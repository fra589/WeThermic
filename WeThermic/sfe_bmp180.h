/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: sfe_bmp180.h is part of WeThermic                             */
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

#ifndef sfe_bmp180_h
  #define sfe_bmp180_h

  #define ALTITUDE 0 // Niveau de la mer
  #define STANDARD_MODE   1
  #define HIGH_RES_MODE   2
  #define ULTRA_HIGH_MODE 3

  // Capteur de mesure température et pression
  extern SFE_BMP180 bmp180;

  void bmp180_init(void);
  void read_bmp180();

#endif

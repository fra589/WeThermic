/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2025 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: affichage.h is part of WeThermic                              */
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

#ifndef affichage_h
  #define affichage_h
  #ifdef HAVE_SCREEN
    #include "Fonts/FreeMono9pt7b.h"
    #include "Fonts/FreeMonoBold12pt7b.h"
    #include "Fonts/FreeMonoBold18pt7b.h"

    #define SCREEN_WIDTH 128 // OLED display width, in pixels
    #define SCREEN_HEIGHT 64 // OLED display height, in pixels

    #define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
    #define SCREEN_ADDRESS 0x3C ///< See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32
    #define SSD1306_NO_SPLASH

    void affichage_init(void);
    void sleepDisplay(void);
    void wakeupDisplay(void);
    void clearDisplay(void);
    void afficheSplash(void);
    void scrollScreen(void);
    void displayTemp(void);
    void displayWifiStatus(void);
  #endif // HAVE_SCREEN
#endif

/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: affichage.cpp is part of WeThermic                            */
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

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
uint8_t _affichage_OK = 0;

// Initialisation affichage
void affichage_init(void) {

  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.printf("Erreur initialisation écran SSD1306 !\n");
  }

  // Active les caractères accentués
  //display.cp437(true);

  // Clear the buffer
  display.clearDisplay();

  // On affichera en blanc sur fond noir
  display.setTextColor(SSD1306_WHITE);

  _affichage_OK = 1;

}

// Efface tout l'écran
void clearDisplay(void) {
  if (_affichage_OK) {
    display.clearDisplay();
  }
}

void afficheSplash(void) {

  clearDisplay();
  display.drawBitmap(0, 0, WeThermicLogo, WETHERMICLOGO_WIDTH, WETHERMICLOGO_HEIGHT, SSD1306_WHITE); 
  display.display();

}

void scrollScreen(void) {
  int i;
  for (i=0; i<64; i+=4) {
    display.clearDisplay();
    display.drawBitmap(0, 0, &WeThermicLogo[16*i], WETHERMICLOGO_WIDTH, WETHERMICLOGO_HEIGHT - i, SSD1306_WHITE);
    display.fillRect(0, WETHERMICLOGO_HEIGHT - i, SCREEN_WIDTH, i, SSD1306_BLACK);
    display.display();
    delay(1);
  }
  display.clearDisplay();
  display.display();
}

// Déclenche l'affichage
void flushDisplay(void) {
  display.display();
}

void displayTemp(void) {
    display.clearDisplay();
    display.setTextColor(WHITE);

    display.setFont(&FreeMonoBold12pt7b);
    display.setTextSize(1);
    display.setCursor(15, 14);
    display.print(vent, 1);
    display.print(" m/s");

    display.setFont(&FreeMonoBold18pt7b);
    display.setTextSize(1);
    display.setCursor(10, 40);
    //display.print(tempBmp180, 1);
    display.print(tempCtn, 1);
    display.print("\xF7");
    display.println("C");

    display.setFont(&FreeMonoBold12pt7b);
    display.setTextSize(1);
    display.setCursor(7, 58);
    display.print((int)round(pression));
    display.print(" hPa");
    /*display.setFont(NULL);
    display.setTextSize(3);
    display.setCursor(8, 38);
    display.print(tempBmp180, 1);
    display.print("\xF7");
    display.println("C");
    */
    display.display();
}

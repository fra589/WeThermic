/*
 * Programme de test du capteur de température et pression
 * Bosch BMP180
*/

#include <SFE_BMP180.h>

#define ALTITUDE 0 // Niveau de la mer
#define STANDARD_MODE   1
#define HIGH_RES_MODE   2
#define ULTRA_HIGH_MODE 3

#define HPA2MMHG 0.750063755419211

SFE_BMP180 bmp180;
uint8_t _bmp180_OK = 0;

#define LED_OUTPUT D5
#define PRESSION_MIN 1010 // pression mini, led éteinte
#define PRESSION_MAX 1080 // pression maxi, led 100 %

void setup() {

  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_OUTPUT, OUTPUT);

  digitalWrite(LED_BUILTIN, LOW); // Allume la LED

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

  digitalWrite(LED_BUILTIN, HIGH); // Eteint la LED

}

void loop() {

  char result;
  double T, P;

  if (_bmp180_OK) {

    ////digitalWrite(LED_BUILTIN, LOW); // Allume la LED

    // On doit commencer par lire la température
    result = bmp180.startTemperature();

    if (result != 0)   {
      // Attente mesure complète:
      delay(result);
      // Lecture de la température
      result = bmp180.getTemperature(T);
      if (result != 0)   {
        Serial.printf("\nbmp180.getTemperature() T = %0.2f °C\n", T);
        // La température est lue, on peux lire la pression
        result = bmp180.startPressure(STANDARD_MODE);
        if (result != 0)   {
          // Attente mesure complète:
          delay(result);
          // Lecture de la pression
          result = bmp180.getPressure(P,T);
          if (result != 0) {
            Serial.printf("BMP180 pression absolue @%0.2f°C = %0.2f hPa (%0.2f mmHg)\n", T, P, P*HPA2MMHG);
            // Allume plus ou moins fort la LED en fonction de la pression
            if (P <= PRESSION_MIN) {
              analogWrite(LED_OUTPUT, 0);
            } else if (P >= PRESSION_MAX) {
              analogWrite(LED_OUTPUT, 255);
            } else {
              int valeur = map(P, PRESSION_MIN, PRESSION_MAX, 0, 255);
              analogWrite(LED_OUTPUT, valeur);
            }
          } else {
            Serial.println("BMP180 erreur getPressure() !");
          }
        } else {
          Serial.println("BMP180 erreur startPressure() !");
        }
      } else {
        Serial.println("BMP180 erreur getTemperature() !");
      }
    } else {
      Serial.println("BMP180 erreur startTemperature() !");
    }

    ////digitalWrite(LED_BUILTIN, HIGH); // Eteint la LED

  } // _bmp180_OK

  delay(250);
  
}

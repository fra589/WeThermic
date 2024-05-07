#!/usr/bin/python2.7
# D'après https://fr.wikipedia.org/wiki/Relation_de_Steinhart-Hart

# on francise le log en log neperien ln !
from math import *
from math import log as ln

Tun = eval(input('Entrez la temperature T1 du premier point (en degres Celsius) : '))
Run = eval(input('et la resistance R1 du premier point (en ohms) : '))
print('\t----------------------------------')
Tdeux = eval(input('Entrez la temperature T2 du deuxieme point (en degres Celsius) : '))
Rdeux = eval(input('et la resistance R2 du deuxieme point(en ohms) : '))
print('\t----------------------------------')
Ttrois = eval(input('Entrez la temperature T3 du troisieme point (en degres Celsius) : '))
Rtrois = eval(input('et la resistance R3 du troisieme point (en ohms) : '))

# calculs en kelvins
Tun = Tun + 273.15
Tdeux = Tdeux + 273.15
Ttrois = Ttrois + 273.15

# changement de variables
Yun = 1/Tun
Ydeux = 1/Tdeux
Ytrois = 1/Ttrois

Lun = ln (Run)
Ldeux = ln (Rdeux)
Ltrois = ln (Rtrois)

# calculs intermediaires
a = (Ldeux-Ltrois)/(Lun-Ldeux)*(pow (Ldeux,3) - pow (Lun,3)) + (pow (Ldeux,3) - pow (Ltrois,3))
b = Ydeux - Ytrois - ((Ldeux-Ltrois)/(Lun-Ldeux))*(Yun-Ydeux)

# calculs de A, B et C
C = b / a
B = (1/(Lun-Ldeux))*(Yun-Ydeux-C*(pow(Lun,3) - pow(Ldeux,3)))
A = Yun - B*Lun - C*pow (Lun,3)

#Affichages de A, B et C
print('\t ###################################################################')
print('Dans l\'equation 1/T = A + B*ln R + C*(ln R)^3 on sait désormais que :')
print('\t ###################################################################')
print('Le coefficient A vaut ', A)
print('Le coefficient B vaut ', B)
print('Le coefficient C vaut ', C)

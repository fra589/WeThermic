/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: wwwifi.h is part of WeThermic                                 */
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

#ifndef wwwifi_h
  #define wwwifi_h

  void wifiApInit(void);
  void wifiClientInit(void);

  String macToString(const unsigned char* mac);
  bool isIp(String str);
  String IPtoString(IPAddress ip);
  String getWifiNetworks(void);
  String getWiFiStatus(wl_status_t wifiStatus);
  String getKnownPassword(String ssid);
  void updateKnownPassword(String ssid, String password);

  #ifdef DEBUG
    void onStationConnected(const WiFiEventSoftAPModeStationConnected& evt);
    void onStationDisconnected(const WiFiEventSoftAPModeStationDisconnected& evt);
  #endif
  #ifdef DEBUG_PROBE
    void onProbeRequestPrint(const WiFiEventSoftAPModeProbeRequestReceived& evt);
  #endif

#endif // becgwifi_h

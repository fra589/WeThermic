/****************************************************************************/
/*                                                                          */
/* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
/*                                                                          */
/* This file: webserver.h is part of WeThermic                              */
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

#ifndef webserver_h
  #define webserver_h

  void webServerInit(void);
  bool captivePortal(void);
  void handleRoot(void);
  void handleNotFound(void);
  bool handleFileRead(String path);
  void handleGetValues(void);
  void handleGetHistory(void);
  void handleGetVersion(void);
  void handleGetNetworks(void);
  void handleDeconnection(void);
  void handleWifiConnect(void);
  void handleGetAPconfig(void);
  void handleSetAPconfig(void);
  void handleReboot(void);
  void handleFSInfo(void);
  void handleWakeup(void);
  String getFileList(String path);

#endif

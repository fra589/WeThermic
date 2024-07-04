#****************************************************************************/
#*                                                                          */
#* Copyright (C) 2023-2024 Gauthier Brière (gauthier.briere "at" gmail.com) */
#*                                                                          */
#* This file: Makefile is part of WeThermic                                 */
#*                                                                          */
#* WeThermic is free software: you can redistribute it and/or modify it     */
#* under the terms of the GNU General Public License as published by        */
#* the Free Software Foundation, either version 3 of the License, or        */
#* (at your option) any later version.                                      */
#*                                                                          */
#* WeThermic is distributed in the hope that it will be useful, but         */
#* WITHOUT ANY WARRANTY; without even the implied warranty of               */
#* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the            */
#* GNU General Public License for more details.                             */
#*                                                                          */
#* You should have received a copy of the GNU General Public License        */
#* along with this program.  If not, see <http://www.gnu.org/licenses/>.    */
#*                                                                          */
#****************************************************************************/

#-----------------------------------------------------------------------------
# Root dir of WeThermic project = $HOME/src/WeThermic
# make should be executed from this dir:
# cd $HOME/src/WeThermic && make <object>
#
# With <object> as:
#
# make firmware: 
# 	Compile the firmware to $HOME/src/WeThermic/WeThermic/build/WeThermic.ino.bin
# make littlefs: 
# 	Create the application filesystem to $HOME/src/WeThermic/WeThermic/build/WeThermic.littlefs.bin
# make flash_firmware:
# 	Flash the firmware to the Wemos D1 mini card
# make flash_littlefs:
# 	Flash the application filesystem to the Wemos D1 mini card
# make flash:
# 	Flash both firmware and application filesystem to the Wemos D1 mini card
# make release:
# 	copy both firmware and filesystem to the release dir with a name which include version
# make clean:
# 	Erase the $HOME/src/WeThermic/WeThermic/build directory
#-----------------------------------------------------------------------------

SHELL=/bin/sh

# Version définie dans WeThermic/WeThermic.h
VERSION_MAJOR:=$$(grep "define APP_VERSION_MAJOR" WeThermic/WeThermic.h | awk '{print $$3}' | sed -e 's/"//g')
VERSION_MINOR:=$$(grep "define APP_VERSION_MINOR" WeThermic/WeThermic.h | awk '{print $$3}' | sed -e 's/"//g')
VERSION_DATE:=$$(grep "define APP_VERSION_DATE" WeThermic/WeThermic.h | awk '{print $$3}' | sed -e 's/"//g')
VERSION=$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_DATE)

# Compression des html, css, js et svg
# from https://github.com/tdewolff/minify (or apt install minify in Debian)
MINIFY=/usr/bin/minify
# Mklittlefs tool from https://github.com/earlephilhower/mklittlefs
# Attention ! Les dernières versions de mklittlefs utilisent LFS_NAME_MAX=128
# cette configuration n'est pas compatible avec les cartes Wemos D1 mini.
# il faut une version compilée avec LFS_NAME_MAX=32.
MKLITTLEFS=/usr/local/bin/mklittlefs

# Compiation Arduino
ARDUINO=/${HOME}/Logiciels/arduino/arduino
ARDUINO_ARG=--verify --preserve-temp-files --verbose
ARDUINO_BOARD=--board esp8266:esp8266:d1_mini_clone
ARDUINO_BUILD=--pref build.path=${HOME}/src/WeThermic/WeThermic/build

# Téléchargement dans la carte Wemos D1 mini
# from https://github.com/espressif/esptool
ESPTOOL=/usr/bin/esptool
CHIP=esp8266
PORT=/dev/ttyUSB0
BAUD=460800


SRC=WeThermic
SRC_INO=$(SRC)/WeThermic.ino
SRC_FIRMWARE=$(wildcard $(SRC)/*.ino) $(wildcard $(SRC)/*.cpp) $(wildcard $(SRC)/*.h)
FIRMWARE=$(SRC)/build/WeThermic.ino.bin
LITTLEFS=$(SRC)/build/WeThermic.littlefs.bin

SRC_APP=WeThermic/data.src
OUT_APP=WeThermic/data
RELEASES=releases

SRC_JS= $(wildcard $(SRC_APP)/*.js)
SRC_HTML= $(wildcard $(SRC_APP)/*.html)
SRC_CSS= $(wildcard $(SRC_APP)/*.css)
SRC_SVG= $(wildcard $(SRC_APP)/images/*.svg)
OUT_JS= $(patsubst $(SRC_APP)/%.js, $(OUT_APP)/%.js, $(SRC_JS))
OUT_HTML= $(patsubst $(SRC_APP)/%.html, $(OUT_APP)/%.html, $(SRC_HTML))
OUT_CSS= $(patsubst $(SRC_APP)/%.css, $(OUT_APP)/%.css, $(SRC_CSS))
OUT_SVG= $(patsubst $(SRC_APP)/images/%.svg, $(OUT_APP)/images/%.svg, $(SRC_SVG))

.PHONY:all
all: firmware littlefs

$(OUT_APP)/%.js: $(SRC_APP)/%.js
	$(MINIFY) $< > $@
$(OUT_APP)/%.html: $(SRC_APP)/%.html
	$(MINIFY) $< > $@
$(OUT_APP)/%.css: $(SRC_APP)/%.css
	$(MINIFY) $< > $@
$(OUT_APP)/%.svg: $(SRC_APP)/%.svg
	$(MINIFY) $< > $@

firmware: $(FIRMWARE)

$(FIRMWARE): $(SRC_FIRMWARE)
	$(ARDUINO) $(ARDUINO_ARG) $(ARDUINO_BOARD) $(ARDUINO_BUILD) $(SRC_INO)

littlefs: $(LITTLEFS)

$(LITTLEFS): $(OUT_JS) $(OUT_HTML) $(OUT_CSS) $(OUT_SVG)
	$(MKLITTLEFS) -c $(OUT_APP) -s 2072576 -p 256 -b 8192 $(LITTLEFS)

release: firmware littlefs
	cp $(FIRMWARE) $(RELEASES)/WeThermic.firmware.$(VERSION).bin
	cp $(LITTLEFS) $(RELEASES)/WeThermic.application.$(VERSION).bin

# flash_firmware : flash le programme et efface les credentials wifi (erase_region 0x3FC000 0x4000)
flash_firmware: firmware
	$(ESPTOOL) --chip $(CHIP) --port $(PORT) --baud $(BAUD) erase_region 0x3FC000 0x4000
	$(ESPTOOL) --chip $(CHIP) --port $(PORT) --baud $(BAUD) write_flash --flash_size detect 0x0 $(FIRMWARE)

flash_littlefs: littlefs
	$(ESPTOOL) --chip $(CHIP) --port $(PORT) --baud $(BAUD) write_flash --flash_size detect 0x200000 $(LITTLEFS)

flash: firmware littlefs
	$(ESPTOOL) --chip $(CHIP) --port $(PORT) --baud $(BAUD) write_flash --flash_size detect --erase-all 0x0 $(FIRMWARE) 0x200000 $(LITTLEFS)

clean:
	rm -rf WeThermic/build/*
	touch WeThermic/build/vide.txt


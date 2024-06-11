#-----------------------------------------------------------------------------
# Minify web application from WeThermic/data.src to WeThermic/data
# Arduino compilation :
# /home/gauthier/Logiciels/arduino/arduino --verify --preserve-temp-files
#   --verbose
#   --pref build.path=$HOME/src/WeThermic/WeThermic/build
#   --board esp8266:esp8266:d1_mini_clone "%d/%f"
#-----------------------------------------------------------------------------
# Root dir of WeThermic project = $HOME/src/WeThermic
# make should be executed from this dir:
# cd $HOME/src/WeThermic && make
#-----------------------------------------------------------------------------

SHELL=/bin/sh -x

VERSION_MAJOR:=$$(grep "define APP_VERSION_MAJOR" WeThermic/WeThermic.h | awk '{print $$3}' | sed -e 's/"//g')
VERSION_MINOR:=$$(grep "define APP_VERSION_MINOR" WeThermic/WeThermic.h | awk '{print $$3}' | sed -e 's/"//g')
VERSION_DATE:=$$(grep "define APP_VERSION_DATE" WeThermic/WeThermic.h | awk '{print $$3}' | sed -e 's/"//g')
VERSION=$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_DATE)

MINIFY=/usr/bin/minify
# Mklittlefs tool from https://github.com/earlephilhower/mklittlefs
MKLITTLEFS=/usr/local/bin/mklittlefs

ARDUINO=/home/gauthier/Logiciels/arduino/arduino
ARDUINO_ARG=--verify --preserve-temp-files --verbose
ARDUINO_BOARD=--board esp8266:esp8266:d1_mini_clone
ARDUINO_BUILD=--pref build.path=/home/gauthier/src/WeThermic/WeThermic/build

ESPTOOL=/usr/bin/esptool

SRC=WeThermic
SRC_INO=$(SRC)/WeThermic.ino
SRC_FIRMWARE=$(SRC_INO) $(wildcard $(SRC)/*.cpp) $(wildcard $(SRC)/*.h)
FIRMWARE=$(SRC)/build/WeThermic.ino.bin

SRC_APP=WeThermic/data.src
OUT_APP=WeThermic/data
BUILD_DIR=builds
PORT=/dev/ttyUSB0

SRC_JS= $(wildcard $(SRC_APP)/*.js)
SRC_HTML= $(wildcard $(SRC_APP)/*.html)
SRC_CSS= $(wildcard $(SRC_APP)/*.css)
SRC_SVG= $(wildcard $(SRC_APP)/images/*.svg)
OUT_JS= $(patsubst $(SRC_APP)/%.js, $(OUT_APP)/%.js, $(SRC_JS))
OUT_HTML= $(patsubst $(SRC_APP)/%.html, $(OUT_APP)/%.html, $(SRC_HTML))
OUT_CSS= $(patsubst $(SRC_APP)/%.css, $(OUT_APP)/%.css, $(SRC_CSS))
OUT_SVG= $(patsubst $(SRC_APP)/images/%.svg, $(OUT_APP)/images/%.svg, $(SRC_SVG))

.PHONY:all
all: mini littlefs

mini: js html css svg
js: $(OUT_JS)
html: $(OUT_HTML)
css: $(OUT_CSS)
svg: $(OUT_SVG)

$(OUT_APP)/%.js: $(SRC_APP)/%.js
	@$(MINIFY) $< > $@
$(OUT_APP)/%.html: $(SRC_APP)/%.html
	@$(MINIFY) $< > $@
$(OUT_APP)/%.css: $(SRC_APP)/%.css
	@$(MINIFY) $< > $@
$(OUT_APP)/%.svg: $(SRC_APP)/%.svg
	@$(MINIFY) $< > $@

firmware: $(FIRMWARE)

$(FIRMWARE): $(SRC_FIRMWARE)
	$(ARDUINO) $(ARDUINO_ARG) $(ARDUINO_BOARD) $(ARDUINO_BUILD) $(SRC_INO)

install: firmware littlefs
	cp $(SRC)/build/WeThermic.ino.bin $(BUILD_DIR)/WeThermic.firmware.$(VERSION).bin
	cp $(SRC)/build/WeThermic_app.bin $(BUILD_DIR)/WeThermic.application.$(VERSION).bin

# ATTENTION, littlefs et flash are not working today !!!
# need to be debugged :-(
littlefs: $(SRC)/build/WeThermic_app.bin

$(SRC)/build/WeThermic_app.bin: $(OUT_JS) $(OUT_HTML) $(OUT_CSS) $(OUT_SVG)
	@$(MKLITTLEFS) -c $(OUT_APP) -s 2072576 -p 256 -b 8192 $(SRC)/build/WeThermic_app.bin

flash: littlefs
	$(ESPTOOL) --port $(PORT) write_flash -fm qio 0x200000 $(SRC)/build/WeThermic_app.bin

# voir https://github.com/earlephilhower/arduino-esp8266littlefs-plugin/blob/master/src/ESP8266LittleFS.java
# https://github.com/esp8266/arduino-esp8266fs-plugin/issues/51




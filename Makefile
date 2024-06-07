# Makefile to minify web application from WeThermic/data.src to WeThermic/data
#-----------------------------------------------------------------------------
# Root dir of WeThermic project = $HOME/src/WeThermic
# make should be executed from this dir:
# cd $HOME/src/WeThermic && make
#
# Mklittlefs tool from https://github.com/earlephilhower/mklittlefs
MKLITTLEFS=${HOME}/src/mklittlefs/mklittlefs

SHELL=/bin/sh -x
MINIFY=/usr/bin/minify

SRC_DIR=WeThermic/data.src
OUT_DIR=WeThermic/data
BUILD_DIR=builds
PORT=/dev/ttyUSB0

SRC_JS= $(wildcard $(SRC_DIR)/*.js)
OUT_JS= $(patsubst $(SRC_DIR)/%.js, $(OUT_DIR)/%.js, $(SRC_JS))
SRC_HTML= $(wildcard $(SRC_DIR)/*.html)
OUT_HTML= $(patsubst $(SRC_DIR)/%.html, $(OUT_DIR)/%.html, $(SRC_HTML))
SRC_CSS= $(wildcard $(SRC_DIR)/*.css)
OUT_CSS= $(patsubst $(SRC_DIR)/%.css, $(OUT_DIR)/%.css, $(SRC_CSS))
SRC_SVG= $(wildcard $(SRC_DIR)/images/*.svg)
OUT_SVG= $(patsubst $(SRC_DIR)/images/%.svg, $(OUT_DIR)/images/%.svg, $(SRC_SVG))

.PHONY:all
all: mini littlefs

mini: js html css svg
js: $(OUT_JS)
html: $(OUT_HTML)
css: $(OUT_CSS)
svg: $(OUT_SVG)

$(OUT_DIR)/%.js: $(SRC_DIR)/%.js
	@$(MINIFY) $< > $@
$(OUT_DIR)/%.html: $(SRC_DIR)/%.html
	@$(MINIFY) $< > $@
$(OUT_DIR)/%.css: $(SRC_DIR)/%.css
	@$(MINIFY) $< > $@
$(OUT_DIR)/%.svg: $(SRC_DIR)/%.svg
	@$(MINIFY) $< > $@


# ATTENTION, littlefs et flash are not working today !!!
# need to be debugged :-(
littlefs: $(BUILD_DIR)/WeThermic_app.bin

$(BUILD_DIR)/WeThermic_app.bin:  $(OUT_JS) $(OUT_HTML) $(OUT_CSS) $(OUT_SVG)
	@$(MKLITTLEFS) -c $(OUT_DIR) -s 2072576 -p 256 -b 8192 $(BUILD_DIR)/WeThermic_app.bin

flash: littlefs
	esptool --port $(PORT) write_flash -fm qio 0x200000 $(BUILD_DIR)/WeThermic_app.bin






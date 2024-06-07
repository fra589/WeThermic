# Makefile to minify web application from WeThermic/data.src to WeThermic/data

SHELL=/bin/sh -x
MINIFY=/usr/bin/minify

SRC_DIR=WeThermic/data.src
OUT_DIR=WeThermic/data

SRC_JS= $(wildcard $(SRC_DIR)/*.js)
OUT_JS= $(patsubst $(SRC_DIR)/%.js, $(OUT_DIR)/%.js, $(SRC_JS))
SRC_HTML= $(wildcard $(SRC_DIR)/*.html)
OUT_HTML= $(patsubst $(SRC_DIR)/%.html, $(OUT_DIR)/%.html, $(SRC_HTML))
SRC_CSS= $(wildcard $(SRC_DIR)/*.css)
OUT_CSS= $(patsubst $(SRC_DIR)/%.css, $(OUT_DIR)/%.css, $(SRC_CSS))
SRC_SVG= $(wildcard $(SRC_DIR)/images/*.svg)
OUT_SVG= $(patsubst $(SRC_DIR)/images/%.svg, $(OUT_DIR)/images/%.svg, $(SRC_SVG))

.PHONY:all

all: js html css svg

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



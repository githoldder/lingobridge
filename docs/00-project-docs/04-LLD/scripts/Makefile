# 清华 thuthesis manual 编译自动化

.PHONY: all clean dist

TEX = xelatex
BIB = bibtex
MAIN = 04-LLD
TEMPLATE_DIR = ../templates
export TEXINPUTS := .:./cls//:
export BIBINPUTS := .:./ref//:
export BSTINPUTS := .:./cls//:

all:
	@echo "编译 thuthesis manual..."
	cd $(TEMPLATE_DIR) && $(TEX) -interaction=nonstopmode -halt-on-error $(MAIN).tex
	cd $(TEMPLATE_DIR) && $(BIB) $(MAIN)
	cd $(TEMPLATE_DIR) && $(TEX) -interaction=nonstopmode -halt-on-error $(MAIN).tex
	cd $(TEMPLATE_DIR) && $(TEX) -interaction=nonstopmode -halt-on-error $(MAIN).tex
	@echo "完成！PDF: $(TEMPLATE_DIR)/$(MAIN).pdf"

clean:
	@echo "清理辅助文件..."
	cd $(TEMPLATE_DIR) && rm -f *.aux *.bbl *.blg *.log *.out *.toc *.synctex.gz *.lof *.lot bu.aux
	@echo "清理完成"

dist: clean
	@echo "清理生成 PDF..."
	cd $(TEMPLATE_DIR) && rm -f $(MAIN).pdf
	@echo "完成"

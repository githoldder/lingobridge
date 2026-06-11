# Makefile for LingoBridge AI Course Report
MAIN = thuthesis-example
PDF = $(MAIN).pdf
OUT_DIR = output

.PHONY: all compile clean

all: compile

compile:
	@echo "==> Starting Quad-Pass XeLaTeX compilation..."
	@mkdir -p $(OUT_DIR)
	xelatex -interaction=nonstopmode $(MAIN)
	bibtex $(MAIN)
	xelatex -interaction=nonstopmode $(MAIN)
	xelatex -interaction=nonstopmode $(MAIN)
	@if [ -f $(PDF) ]; then \
		mv $(PDF) $(OUT_DIR)/报告.pdf; \
		echo "==> Compilation completed. Output saved to $(OUT_DIR)/报告.pdf"; \
	else \
		echo "==> ERROR: PDF generation failed."; \
		exit 1; \
	fi

clean:
	@echo "==> Cleaning up auxiliary files..."
	rm -rf *.aux *.log *.toc *.lof *.lot *.out *.bbl *.blg *.synctex.gz *.run.xml *-blx.bib
	rm -rf data/*.aux
	rm -rf .texpadtmp

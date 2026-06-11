.PHONY: all run generate graph train calibrate clean

all: run

run: generate graph train calibrate
	@echo "==> AI Pipeline Execution Completed Successfully!"

generate:
	python src/generate_data.py

graph:
	python src/build_knowledge_graph.py

train:
	python src/train_knowledge_tracing.py

calibrate:
	python scripts/calibrate_subtitles.py

clean:
	@echo "==> Cleaning up simulated datasets and metrics..."
	rm -rf data/*.csv
	rm -rf output/*

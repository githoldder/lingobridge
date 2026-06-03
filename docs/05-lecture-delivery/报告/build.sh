#!/bin/bash
# LingoBridge LaTeX Compile Script
set -e

cd "$(dirname "$0")"
echo "==> Invoking Makefile to build LingoBridge AI Course Report..."
make clean
make
echo "==> Build successfully completed!"

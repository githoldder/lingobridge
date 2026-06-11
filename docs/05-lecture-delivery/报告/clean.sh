#!/bin/bash
# LingoBridge LaTeX Clean Script
cd "$(dirname "$0")"
echo "==> Invoking Makefile to clean up LingoBridge AI Course Report workspace..."
make clean
echo "==> Workspace cleaned!"

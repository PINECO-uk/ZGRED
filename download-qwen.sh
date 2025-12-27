#!/bin/bash

# Script to download Qwen 2.5:7b model for Ollama

echo "========================================="
echo "Downloading Qwen 2.5:7b model for Ollama"
echo "========================================="
echo ""
echo "Model size: ~4.7GB"
echo "This may take a few minutes depending on your internet connection..."
echo ""

# Pull the model
ollama pull qwen2.5:7b

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Successfully downloaded Qwen 2.5:7b"
    echo ""
    echo "Verifying model..."
    ollama list | grep qwen2.5
    echo ""
    echo "Model is ready to use!"
else
    echo ""
    echo "✗ Failed to download Qwen 2.5:7b"
    echo "Please check your internet connection and Ollama installation"
    exit 1
fi

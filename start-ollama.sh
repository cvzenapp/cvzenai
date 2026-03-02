#!/bin/bash
# Ollama service startup script
echo "Starting Ollama service..."
ollama serve &
echo "Ollama service started on http://localhost:11434"

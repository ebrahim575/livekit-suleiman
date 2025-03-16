#!/bin/bash

# Exit on error
# set -e

# # Check if .env file exists
# if [ ! -f .env.local ] && [ ! -f .env ]; then
#     echo "No .env or .env.local file found. Creating from .env.example..."
#     cp .env.example .env.local
#     echo "Please edit .env.local with your configuration values"
#     exit 1
# fi
echo "cding into voice-pipeline-agent-python"

cd voice-pipeline-agent-python

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/upgrade pip
python3 -m pip install --upgrade pip

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

echo "downloading model files"
python3 agent.py download-files

# Run the agent
echo "Starting the voice pipeline agent..."
python3 agent.py connect --room suleiman
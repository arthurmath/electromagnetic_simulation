#!/bin/bash

echo "=== Comparing Coil and Magnet Magnetic Fields ==="
echo ""
echo "Step 1: Generating field data using JavaScript classes..."
node compare_fields.js

if [ $? -eq 0 ]; then
    echo ""
    echo "Step 2: Plotting comparison graphs..."
    python3 compare_plots.py
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✓ Comparison complete! Check field_comparison.png"
    else
        echo "✗ Python plotting failed"
        exit 1
    fi
else
    echo "✗ JavaScript data generation failed"
    exit 1
fi

# bash compare_run.sh
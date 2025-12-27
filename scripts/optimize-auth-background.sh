#!/bin/bash
# Script to optimize the auth background image to WebP format
# Requires: imagemagick or cwebp (from webp package)
# Usage: ./scripts/optimize-auth-background.sh

SOURCE_IMAGE="public/signin-background.jpg"
OUTPUT_DIR="public"

echo "Optimizing auth background image..."

# Check if source exists
if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image not found at $SOURCE_IMAGE"
  exit 1
fi

# Check for imagemagick (convert command)
if command -v convert &> /dev/null; then
  echo "Using ImageMagick..."
  
  # Create 1280px wide version
  convert "$SOURCE_IMAGE" -resize 1280x -quality 85 -format webp "${OUTPUT_DIR}/signin-background-1280.webp"
  echo "✓ Created signin-background-1280.webp"
  
  # Create 1920px wide version
  convert "$SOURCE_IMAGE" -resize 1920x -quality 85 -format webp "${OUTPUT_DIR}/signin-background-1920.webp"
  echo "✓ Created signin-background-1920.webp"
  
  # Create full-size WebP version
  convert "$SOURCE_IMAGE" -quality 85 -format webp "${OUTPUT_DIR}/signin-background.webp"
  echo "✓ Created signin-background.webp"
  
elif command -v cwebp &> /dev/null; then
  echo "Using cwebp..."
  
  # Create 1280px wide version (requires imagemagick for resize, or use cwebp with -resize)
  # For cwebp, we'd need to resize first or use a different approach
  echo "Note: cwebp doesn't resize. Please use ImageMagick or resize manually first."
  cwebp -q 85 "$SOURCE_IMAGE" -o "${OUTPUT_DIR}/signin-background.webp"
  echo "✓ Created signin-background.webp (full size)"
  
else
  echo "Error: Neither ImageMagick (convert) nor cwebp found."
  echo "Install ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
  echo "Or install webp tools: brew install webp (macOS) or apt-get install webp (Linux)"
  exit 1
fi

echo ""
echo "Optimization complete!"
echo "Files created in ${OUTPUT_DIR}/:"
echo "  - signin-background-1280.webp (for mobile/small screens)"
echo "  - signin-background-1920.webp (for tablets/medium screens)"
echo "  - signin-background.webp (for desktop/large screens)"


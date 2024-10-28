echo "Running feishu-pages..."
/usr/local/bin/feishu-pages $@
echo "Trimming whiteboard images to remove whitespace..."
echo "Dist $OUTPUT_DIR"
find $OUTPUT_DIR -name "*-board.png" -exec mogrify -trim {} +

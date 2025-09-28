#!/bin/bash

# IDSnap APK Build Script
# This script automates the APK building process

echo "🚀 IDSnap APK Build Script"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if android directory exists
if [ ! -d "android" ]; then
    print_error "Android directory not found. This doesn't appear to be a React Native project."
    exit 1
fi

print_status "Starting APK build process..."

# Step 1: Install dependencies
print_status "Installing Node.js dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 2: Clean previous builds
print_status "Cleaning previous builds..."
cd android
if ./gradlew clean; then
    print_success "Previous builds cleaned"
else
    print_warning "Clean command failed, continuing anyway..."
fi

# Step 3: Build APK
print_status "Building release APK..."
echo "This may take several minutes..."

if ./gradlew assembleRelease; then
    print_success "APK built successfully!"
else
    print_error "APK build failed"
    exit 1
fi

# Step 4: Check if APK was created
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    print_success "APK found at: android/$APK_PATH"
    
    # Get APK size
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    print_status "APK size: $APK_SIZE"
    
    # Copy APK to project root with version name
    cd ..
    cp "android/$APK_PATH" "./IDSnap_v1.0.apk"
    print_success "APK copied to project root as IDSnap_v1.0.apk"
    
else
    print_error "APK not found at expected location"
    exit 1
fi

# Step 5: Create delivery package
print_status "Creating delivery package..."
DELIVERY_DIR="IDSnap_Delivery_$(date +%Y%m%d)"
mkdir -p "$DELIVERY_DIR"

# Copy files to delivery directory
cp "IDSnap_v1.0.apk" "$DELIVERY_DIR/"
cp "CLIENT_INSTALLATION_GUIDE.md" "$DELIVERY_DIR/"
cp "BUILD_GUIDE.md" "$DELIVERY_DIR/"

# Create a simple README for the delivery package
cat > "$DELIVERY_DIR/README.txt" << EOF
IDSnap - Android Application Delivery Package
=============================================

Contents:
- IDSnap_v1.0.apk: The Android application (install this on your device)
- CLIENT_INSTALLATION_GUIDE.md: Step-by-step installation instructions
- BUILD_GUIDE.md: Technical build documentation

Installation:
1. Transfer IDSnap_v1.0.apk to your Android device
2. Follow the instructions in CLIENT_INSTALLATION_GUIDE.md
3. Install and enjoy!

System Requirements:
- Android 6.0 or higher
- 2GB RAM minimum
- 100MB free storage
- Camera access required

Build Date: $(date)
Version: 1.0.0

For support, contact the development team.
EOF

print_success "Delivery package created: $DELIVERY_DIR/"

# Step 6: Final summary
echo ""
echo "🎉 Build Complete!"
echo "=================="
echo "✅ APK built successfully"
echo "✅ Delivery package created"
echo ""
echo "📦 Deliverables:"
echo "   • IDSnap_v1.0.apk ($(du -h IDSnap_v1.0.apk | cut -f1))"
echo "   • $DELIVERY_DIR/ (complete delivery package)"
echo ""
echo "📱 Next Steps:"
echo "   1. Test the APK on Android devices"
echo "   2. Share the delivery package with your client"
echo "   3. Provide the installation guide to end users"
echo ""
print_success "Ready for client delivery! 🚀"

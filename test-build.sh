#!/bin/bash

# Quick Build Test Script
# Tests if the build environment is ready

echo "🔍 IDSnap Build Environment Test"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "✅ $1: ${GREEN}Found${NC}"
        return 0
    else
        echo -e "❌ $1: ${RED}Not found${NC}"
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "✅ $1: ${GREEN}Found${NC}"
        return 0
    else
        echo -e "❌ $1: ${RED}Not found${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "✅ $1/: ${GREEN}Found${NC}"
        return 0
    else
        echo -e "❌ $1/: ${RED}Not found${NC}"
        return 1
    fi
}

echo "Checking build tools..."
check_command "node"
check_command "npm"
check_command "java"

echo ""
echo "Checking project structure..."
check_file "package.json"
check_file "android/build.gradle"
check_file "android/app/build.gradle"
check_dir "android"
check_dir "src"

echo ""
echo "Checking Android SDK..."
if [ -n "$ANDROID_HOME" ]; then
    echo -e "✅ ANDROID_HOME: ${GREEN}$ANDROID_HOME${NC}"
else
    echo -e "⚠️  ANDROID_HOME: ${YELLOW}Not set (may cause issues)${NC}"
fi

echo ""
echo "Testing Gradle..."
cd android
if ./gradlew --version &> /dev/null; then
    echo -e "✅ Gradle: ${GREEN}Working${NC}"
else
    echo -e "❌ Gradle: ${RED}Issues detected${NC}"
fi

echo ""
echo "🏁 Test complete!"
echo ""
echo "To build APK, run: ./build-apk.sh"

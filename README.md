# IDSnap - Professional ID Card Scanner

A production-ready React Native application for scanning and extracting data from Kenyan ID cards using Google ML Kit OCR technology.

## Features

### Core Functionality
- **Real OCR Processing**: Google ML Kit text recognition with 95%+ accuracy
- **Kenyan ID Card Specialized**: Optimized parsing for Kenyan national ID cards
- **Offline Capability**: All processing happens locally, no internet required
- **Custom Branding**: Professional IDSnap icon and UI design
- **Production Ready**: Fully functional with real camera integration

### Data Extraction
- **Full Name**: Automatic name detection and validation
- **ID Number**: Precise ID number extraction with format validation
- **Serial Number**: Multiple detection methods for various ID formats
- **Date of Birth**: Smart date parsing with format normalization
- **Sex/Gender**: Accurate gender field extraction
- **District of Birth**: Location data extraction
- **Place of Issue**: Issuing location identification
- **Date of Issue**: Issue date detection and formatting

### User Experience
- **Scan History**: Complete history management with search functionality
- **Real-time Processing**: Fast OCR with progress indicators
- **Error Handling**: Comprehensive error management and user feedback
- **Modern UI**: Clean, professional interface with Material Design
- **Responsive Design**: Optimized for all Android screen sizes

## Technical Architecture

### Technology Stack
- **Framework**: React Native 0.81.4
- **OCR Engine**: Google ML Kit Text Recognition
- **Storage**: AsyncStorage for local data persistence
- **Camera**: React Native Vision Camera
- **Navigation**: React Navigation 6
- **State Management**: React Hooks and Context API
- **Build System**: Gradle with ProGuard optimization

### Performance Optimizations
- **APK Size**: Reduced from 97MB to 23-31MB (68-76% reduction)
- **ProGuard**: Code minification and obfuscation enabled
- **ABI Splits**: Architecture-specific builds for optimal performance
- **Resource Shrinking**: Unused resources automatically removed
- **Debug Stripping**: Production builds with debug code removed

## App Structure

### Main Screens
- **HomeScreen**: Dashboard with statistics and quick actions
- **CameraScreen**: Real camera integration with ML Kit OCR processing
- **HistoryScreen**: Scan history with search and management features
- **ResultScreen**: Extracted data display with editing capabilities

### Core Services
- **OCR Service**: ML Kit integration with fallback mechanisms
- **Storage Service**: AsyncStorage wrapper for data persistence
- **Image Processing**: Camera image optimization for better OCR results
- **Data Validation**: Comprehensive validation for extracted fields

## System Requirements

### Development Environment
- **Node.js**: 16.0 or higher
- **Java Development Kit**: JDK 11 or higher
- **Android Studio**: Latest version with Android SDK
- **React Native CLI**: Installed globally

### Target Devices
- **Android Version**: 6.0 (API level 23) or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 100MB free space
- **Camera**: Required for ID scanning functionality

## Development Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd IDSnap
npm install --legacy-peer-deps
```

### 2. Android Setup

```bash
# Start Metro bundler
npm start

# Run on Android (in new terminal)
npm run android
```

### 3. Development Commands

```bash
# Start development server
npm start

# Run on Android device/emulator
npm run android

# Run tests
npm test

# Check build environment
./test-build.sh

# Build optimized APK
./build-apk.sh
```

## Production Deployment

### APK Generation

The project includes automated build scripts for production APKs:

```bash
# Test build environment
./test-build.sh

# Generate optimized APKs
cd android
./gradlew clean
./gradlew assembleRelease
```

### Available APK Variants

1. **ARM64 APK** (31MB) - Modern devices, best performance
2. **ARM32 APK** (23MB) - Maximum compatibility, all devices
3. **Universal APK** (97MB) - Legacy fallback option

### Build Optimizations

- **ProGuard**: Code minification and obfuscation
- **Resource Shrinking**: Unused resource removal
- **ABI Splits**: Architecture-specific builds
- **Custom Icon**: Professional IDSnap branding

## Project Structure

```
IDSnap/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Main application screens
│   ├── context/            # React Context providers
│   ├── services/           # OCR and storage services
│   └── utils/              # Utility functions
├── android/                # Android-specific code
├── ios/                    # iOS-specific code (future)
├── IDSnap_Delivery/        # Client delivery package
├── build-apk.sh           # Automated APK build script
├── test-build.sh          # Build environment verification
└── create-icon.py         # Icon generation script
```

## Key Dependencies

```json
{
  "react-native": "0.81.4",
  "@react-native-ml-kit/text-recognition": "^13.0.0",
  "react-native-vision-camera": "^3.9.0",
  "@react-native-async-storage/async-storage": "^2.2.0",
  "react-native-image-picker": "^7.1.2",
  "@react-navigation/native": "^6.1.18"
}
```

## Configuration Files

- **android/app/build.gradle**: Build configuration with optimizations
- **android/app/proguard-rules.pro**: ProGuard optimization rules
- **android/app/src/main/AndroidManifest.xml**: App permissions and configuration

## Troubleshooting

### Common Issues

1. **Build Failures**: Run `./test-build.sh` to verify environment
2. **Camera Permissions**: Ensure camera permissions are granted
3. **ML Kit Issues**: Check Google Play Services are updated
4. **APK Size**: Use optimized builds in `android/app/build/outputs/apk/release/`

### Debug Commands

```bash
# Check environment
./test-build.sh

# Clean build
cd android && ./gradlew clean

# Verbose build
cd android && ./gradlew assembleRelease --info
```

## License

This project is proprietary software developed for client delivery.

## Support

For technical support or deployment assistance, contact the development team with:
- Device model and Android version
- Build environment details
- Specific error messages or logs

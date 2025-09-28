# IDSnap - APK Build & Deployment Guide

## 📱 Building APK for Client Delivery

### Prerequisites

1. **Android Studio** installed with Android SDK
2. **Java Development Kit (JDK)** 11 or higher
3. **Node.js** and **npm/yarn** installed
4. **React Native CLI** installed globally

### Step 1: Environment Setup

```bash
# Check if you have the required tools
node --version
npm --version
java -version
android --version  # or check Android Studio SDK Manager
```

### Step 2: Install Dependencies

```bash
# Navigate to project directory
cd /home/k-kimutai/PROJECTS/IDSnap

# Install Node.js dependencies
npm install

# Install Android dependencies
cd android
./gradlew clean
cd ..
```

### Step 3: Configure Release Build

#### A. Update App Version (Optional)
Edit `android/app/build.gradle`:

```gradle
defaultConfig {
    applicationId "com.idsnap"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 2          // Increment for each release
    versionName "1.1.0"    // Update version name
}
```

#### B. Generate Release Keystore (For Production)

```bash
# Navigate to android/app directory
cd android/app

# Generate release keystore
keytool -genkeypair -v -storetype PKCS12 -keystore idsnap-release-key.keystore -alias idsnap-key-alias -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted to enter:
# - Keystore password (remember this!)
# - Key password (remember this!)
# - Your details (name, organization, etc.)
```

#### C. Configure Gradle for Release Signing

Create/edit `android/gradle.properties`:

```properties
IDSNAP_UPLOAD_STORE_FILE=idsnap-release-key.keystore
IDSNAP_UPLOAD_KEY_ALIAS=idsnap-key-alias
IDSNAP_UPLOAD_STORE_PASSWORD=your_keystore_password
IDSNAP_UPLOAD_KEY_PASSWORD=your_key_password
```

Update `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (project.hasProperty('IDSNAP_UPLOAD_STORE_FILE')) {
                storeFile file(IDSNAP_UPLOAD_STORE_FILE)
                storePassword IDSNAP_UPLOAD_STORE_PASSWORD
                keyAlias IDSNAP_UPLOAD_KEY_ALIAS
                keyPassword IDSNAP_UPLOAD_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled enableProguardInReleaseBuilds
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}
```

### Step 4: Build APK

#### Option A: Debug APK (Quick Testing)
```bash
# From project root
cd android
./gradlew assembleDebug

# APK will be generated at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Release APK (Production)
```bash
# From project root
cd android
./gradlew assembleRelease

# APK will be generated at:
# android/app/build/outputs/apk/release/app-release.apk
```

#### Option C: Using React Native CLI
```bash
# From project root
npx react-native build-android --mode=release
```

### Step 5: Generate AAB (Android App Bundle) - Recommended for Play Store

```bash
# From project root
cd android
./gradlew bundleRelease

# AAB will be generated at:
# android/app/build/outputs/bundle/release/app-release.aab
```

## 📦 Client Delivery Package

### Create Delivery Folder Structure

```bash
# Create delivery package
mkdir IDSnap_v1.0_Delivery
cd IDSnap_v1.0_Delivery

# Copy APK
cp ../android/app/build/outputs/apk/release/app-release.apk ./IDSnap_v1.0.apk

# Create documentation
```

### Delivery Package Contents

1. **IDSnap_v1.0.apk** - The installable Android app
2. **Installation_Guide.md** - User installation instructions
3. **User_Manual.md** - How to use the app
4. **Technical_Specs.md** - Technical requirements and features
5. **Release_Notes.md** - What's new in this version

## 📋 Installation Guide for Client

### System Requirements
- **Android Version**: 6.0 (API level 23) or higher
- **RAM**: Minimum 2GB, Recommended 4GB+
- **Storage**: 100MB free space
- **Camera**: Required for ID scanning
- **Permissions**: Camera, Storage access

### Installation Steps

1. **Enable Unknown Sources**:
   - Go to Settings > Security
   - Enable "Unknown Sources" or "Install from Unknown Sources"

2. **Install APK**:
   - Transfer IDSnap_v1.0.apk to your Android device
   - Tap the APK file to install
   - Grant required permissions when prompted

3. **First Launch**:
   - Open IDSnap app
   - Grant camera and storage permissions
   - The app is ready to use!

## 🔧 Troubleshooting

### Common Build Issues

1. **Gradle Build Failed**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

2. **Memory Issues**:
   ```bash
   export GRADLE_OPTS="-Xmx4g -XX:MaxPermSize=512m"
   ```

3. **SDK Issues**:
   - Open Android Studio
   - Go to SDK Manager
   - Install required SDK versions

### App Installation Issues

1. **"App not installed" error**:
   - Check if device has enough storage
   - Ensure Android version compatibility
   - Try uninstalling any previous versions

2. **Permission Issues**:
   - Go to App Settings > Permissions
   - Manually enable Camera and Storage permissions

## 🚀 Advanced Options

### Optimize APK Size

Add to `android/app/build.gradle`:

```gradle
android {
    ...
    buildTypes {
        release {
            ...
            shrinkResources true
            minifyEnabled true
        }
    }
    
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "arm64-v8a", "armeabi-v7a", "x86", "x86_64"
        }
    }
}
```

### Enable Proguard (Code Obfuscation)

Set in `android/app/build.gradle`:
```gradle
def enableProguardInReleaseBuilds = true
```

## 📊 Build Verification

### Test the APK

1. **Install on Test Device**:
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. **Check App Functionality**:
   - Camera scanning works
   - OCR text extraction
   - History saving/loading
   - All navigation flows

3. **Performance Testing**:
   - App startup time
   - Memory usage
   - Battery consumption during scanning

## 📝 Delivery Checklist

- [ ] APK builds successfully
- [ ] App installs on test devices
- [ ] All features work correctly
- [ ] Permissions are properly requested
- [ ] No crashes or critical bugs
- [ ] Documentation is complete
- [ ] Version numbers are updated
- [ ] Release notes are prepared

## 🔐 Security Notes

- **Keep keystore file secure** - Never share or commit to version control
- **Backup keystore** - Store in secure location with passwords
- **Use different keystores** for debug and release builds
- **Test on multiple devices** before client delivery

## 📞 Support Information

For technical support or build issues:
- Developer: [Your Contact Information]
- Project Repository: [GitHub URL]
- Build Date: [Current Date]
- Version: 1.0.0

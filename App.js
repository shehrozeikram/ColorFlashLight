/**
 * Color Flashlight App
 * A professional flashlight app with multiple color options and continuous color transitions
 */

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  StatusBar,
  Platform,
  Dimensions,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

// Rainbow colors for continuous transition - using more colors for smoother spectrum
const RAINBOW_COLORS = [
  '#8B0000', // Dark Red
  '#FF0000', // Red
  '#FF4500', // Orange Red
  '#FF8C00', // Dark Orange
  '#FFA500', // Orange
  '#FFD700', // Gold
  '#FFFF00', // Yellow
  '#9ACD32', // Yellow Green
  '#32CD32', // Lime Green
  '#008000', // Green
  '#006400', // Dark Green
  '#00FFFF', // Cyan
  '#1E90FF', // Dodger Blue
  '#0000FF', // Blue
  '#000080', // Navy
  '#4B0082', // Indigo
  '#800080', // Purple
  '#8B008B', // Dark Magenta
  '#FF00FF', // Magenta
  '#FF1493', // Deep Pink
  '#C71585', // Medium Violet Red
  '#8B0000', // Dark Red (back to start)
];

// Ultra-sharp colors array - arranged in rainbow sequence
const SHARP_COLORS = [
  '#FF0000', // Red
  '#FF4500', // Orange Red
  '#FFFF00', // Yellow
  '#00FF7F', // Green
  '#00FFFF', // Cyan
  '#0000FF', // Blue
  '#9400D3', // Violet
  '#FF00FF', // Pink
  '#FFFFFF', // White
];

// Use the same colors for disco mode
const DISCO_COLORS = SHARP_COLORS;

const App = () => {
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isRainbowMode, setIsRainbowMode] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const currentColorIndex = useRef(0);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (!hasPermission) {
      const permission = await requestPermission();
      if (!permission) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to use the flashlight. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Handle disco light animation
  useEffect(() => {
    let discoInterval;
    let flashInterval;

    if (isRainbowMode) {
      // Reset to red when starting disco mode
      currentColorIndex.current = 0;
      setSelectedColor(DISCO_COLORS[0]); // Start with red

      // Sequential color changes following rainbow order
      discoInterval = setInterval(() => {
        currentColorIndex.current = (currentColorIndex.current + 1) % DISCO_COLORS.length;
        setSelectedColor(DISCO_COLORS[currentColorIndex.current]);
      }, 500); // Slower transition to better see each color

      // Flash effect
      flashInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.9,
            duration: 100,
            useNativeDriver: false,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
          }),
        ]).start();
      }, 400);
    } else {
      // Reset color index when disco mode is turned off
      currentColorIndex.current = 0;
    }

    return () => {
      if (discoInterval) clearInterval(discoInterval);
      if (flashInterval) clearInterval(flashInterval);
      flashAnim.setValue(1);
    };
  }, [isRainbowMode, flashAnim]);

  const selectColor = (color) => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to use the flashlight.',
        [
          { text: 'Request Permission', onPress: checkPermission },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (!isCameraReady) {
      Alert.alert(
        'Camera Not Ready',
        'Please wait for the camera to initialize.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedColor(color);
    setIsRainbowMode(false);
    // Toggle torch based on whether white is selected
    setIsTorchOn(color === '#FFFFFF');
    // Ensure full brightness by setting opacity to 1
    fadeAnim.setValue(1);
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera permission is required</Text>
        <TouchableOpacity style={styles.button} onPress={checkPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No camera device found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={selectedColor}
      />
      
      {/* Hidden camera component for torch control */}
      <Camera
        style={styles.hiddenCamera}
        device={device}
        isActive={true}
        torch={isTorchOn ? 'on' : 'off'}
        onInitialized={() => setIsCameraReady(true)}
        onError={(error) => {
          console.error('Camera error:', error);
          Alert.alert('Camera Error', error.message);
        }}
      />

      {/* Main Flashlight Screen */}
      <Animated.View
        style={[
          styles.flashlightScreen,
          {
            backgroundColor: selectedColor,
            opacity: isRainbowMode ? flashAnim : 1,
          },
        ]}
      />

      {/* Color Grid with Disco Button */}
      <View style={styles.mainColorGrid}>
        {SHARP_COLORS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.mainColorButton,
              {backgroundColor: color},
              color === '#FFFFFF' && isTorchOn && styles.selectedButton
            ]}
            onPress={() => selectColor(color)}
            disabled={!isCameraReady}
          />
        ))}
        {/* Disco Button */}
        <TouchableOpacity
          onPress={() => {
            setIsRainbowMode(!isRainbowMode);
            setIsTorchOn(false); // Turn off torch when entering disco mode
          }}
          style={styles.discoButton}
          disabled={!isCameraReady}
        >
          <Image 
            source={require('./assets/disco.png')}
            style={styles.discoIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  hiddenCamera: {
    width: 1,
    height: 1,
    position: 'absolute',
    opacity: 0,
  },
  flashlightScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 1,
  },
  mainColorGrid: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'ios' ? 100 : 80,
    flexDirection: 'column',
    gap: 10,
    padding: 10,
    alignItems: 'flex-start',
  },
  mainColorButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  selectedButton: {
    borderWidth: 3,
    borderColor: '#00FF00',
  },
  controlsContainer: {
    position: 'absolute',
    right: 15,
    top: Platform.OS === 'ios' ? 100 : 80,
    alignItems: 'center',
  },
  discoButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: -7.5,
  },
  discoIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  text: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
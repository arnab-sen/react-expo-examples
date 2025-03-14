import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import React, { useRef, useState, useEffect } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("back");
  const [recording, setRecording] = useState(false);
  const [isBarcodeScanning, setIsBarcodeScanning] = useState(false);
  const [barcodeData, setBarcodeData] = useState<BarcodeScanningResult | null>(null);
  const [scanningPaused, setScanningPaused] = useState(false);

  // Auto-enable barcode scanning when the app starts
  useEffect(() => {
    setIsBarcodeScanning(true);
  }, []);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    const photo = await ref.current?.takePictureAsync();
    setUri(photo?.uri);
  };

  const recordVideo = async () => {
    if (recording) {
      setRecording(false);
      ref.current?.stopRecording();
      return;
    }
    setRecording(true);
    const video = await ref.current?.recordAsync();
    console.log({ video });
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "picture" ? "video" : "picture"));
    // Reset barcode scanning when changing mode
    if (isBarcodeScanning) {
      setIsBarcodeScanning(false);
      setBarcodeData(null);
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  };

  const toggleBarcodeScanning = () => {
    setIsBarcodeScanning((prev) => !prev);
    setBarcodeData(null);
    setScanningPaused(false);
  };

  const handleBarCodeScanned = (scanningResult: BarcodeScanningResult) => {
    if (scanningPaused) return;
    
    console.log("Barcode detected:", scanningResult);
    setBarcodeData(scanningResult);
    setScanningPaused(true);
  };

  const scanAgain = () => {
    setBarcodeData(null);
    setScanningPaused(false);
  };

  const renderPicture = () => {
    return (
      <View>
        <Image
          source={{ uri }}
          contentFit="contain"
          style={{ width: 300, aspectRatio: 1 }}
        />
        <Button onPress={() => setUri(null)} title="Take another picture" />
      </View>
    );
  };

  const renderBarcodeResult = () => {
    // Format ISBN data for better display
    let formattedData = barcodeData?.data || "";
    let barcodeType = barcodeData?.type || "";
    
    // Identify if it's an ISBN (EAN-13 starting with 978 or 979)
    if (barcodeType === "ean13" && (formattedData.startsWith("978") || formattedData.startsWith("979"))) {
      barcodeType = "ISBN (EAN-13)";
    }
    
    return (
      <View style={styles.barcodeResultContainer}>
        <Text style={styles.barcodeTitle}>Barcode Detected!</Text>
        <Text style={styles.barcodeText}>Type: {barcodeType}</Text>
        <Text style={styles.barcodeText}>Data: {formattedData}</Text>
        <Button 
          onPress={scanAgain} 
          title="Scan Another Barcode" 
        />
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <CameraView
        style={styles.camera}
        ref={ref}
        mode={mode}
        facing={facing}
        mute={false}
        onBarcodeScanned={isBarcodeScanning && !scanningPaused ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "qr", "pdf417", "aztec", "code128", "code39", "code93", "ean8", "upc_e"],
        }}
        zoom={0.1}
        enableTorch={true}
        responsiveOrientationWhenOrientationLocked
      >
        <View style={styles.shutterContainer}>
          <Pressable onPress={toggleMode}>
            {mode === "picture" ? (
              <AntDesign name="picture" size={32} color="white" />
            ) : (
              <Feather name="video" size={32} color="white" />
            )}
          </Pressable>
          {!isBarcodeScanning && (
            <Pressable onPress={mode === "picture" ? takePicture : recordVideo}>
              {({ pressed }) => (
                <View
                  style={[
                    styles.shutterBtn,
                    {
                      opacity: pressed ? 0.5 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.shutterBtnInner,
                      {
                        backgroundColor: mode === "picture" ? "white" : "red",
                      },
                    ]}
                  />
                </View>
              )}
            </Pressable>
          )}
          <Pressable onPress={toggleBarcodeScanning}>
            <MaterialCommunityIcons 
              name={isBarcodeScanning ? "barcode-off" : "barcode-scan"} 
              size={32} 
              color={isBarcodeScanning ? "#00ff00" : "white"} 
            />
          </Pressable>
          <Pressable onPress={toggleFacing}>
            <FontAwesome6 name="rotate-left" size={32} color="white" />
          </Pressable>
        </View>
        {isBarcodeScanning && !barcodeData && (
          <View style={styles.barcodeScanOverlay}>
            <View style={styles.scannerGuide}>
              <View style={styles.scannerBorder} />
            </View>
            <Text style={styles.barcodeScanText}>
              Position barcode within the frame
            </Text>
          </View>
        )}
      </CameraView>
    );
  };

  return (
    <View style={styles.container}>
      {uri ? renderPicture() : (barcodeData ? renderBarcodeResult() : renderCamera())}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  barcodeScanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  barcodeScanText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  scannerGuide: {
    width: 280,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerBorder: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 8,
  },
  barcodeResultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f0f0',
    width: '100%',
  },
  barcodeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  barcodeText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
});

import React from 'react';
import { StyleSheet, View, Text, Button } from 'react-native'; // Importa Button
import CustomButton from '../components/CustomButton';

export default function MapScreen() {
  const handlePress = () => {
    alert('¡Botón presionado!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.diagnosticText}>
        Prueba de Visibilidad con Botón Nativo
      </Text>

      {/* Botón estándar de React Native */}
      <View style={styles.nativeButtonContainer}>
        <Button
          title="Botón Nativo (¿Me ves?)"
          onPress={handlePress}
          color="#841584" // Un color distintivo
        />
      </View>

      {/* Tu CustomButton */}
      <View style={styles.customButtonContainer}>
        <CustomButton
          title="CustomButton (¿Me ves?)"
          onPress={handlePress}
          color="#FF6347"
          textColor="white"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diagnosticText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  nativeButtonContainer: {
    margin: 20,
    borderWidth: 2,
    borderColor: 'purple',
    padding: 10,
  },
  customButtonContainer: {
    margin: 20,
    borderWidth: 2,
    borderColor: 'red',
    padding: 10,
  },
});
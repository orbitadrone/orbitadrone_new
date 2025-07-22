import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: object;
  textStyle?: object;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, color, textColor, style, textStyle }) => {
  const buttonBackgroundColor = color || Colors.primary;
  
  // Lógica de color de texto corregida
  const buttonTextColor = (buttonBackgroundColor === Colors.primary || buttonBackgroundColor === Colors.secondary || buttonBackgroundColor === Colors.accent)
    ? Colors.textDark 
    : textColor || Colors.text;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: buttonBackgroundColor },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonText, { color: buttonTextColor }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 50, // Botones muy redondeados (forma de píldora)
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    elevation: 1, // Elevación sutil para el contorno
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, // Sombra muy sutil para iOS
    shadowRadius: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomButton;
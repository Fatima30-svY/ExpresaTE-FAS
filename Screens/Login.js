import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const logo = require('../assets/Icono.png');

export default function LoginScreen({ navigation }) {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [usuarioFocused, setUsuarioFocused] = useState(false);
  const [contrasenaFocused, setContrasenaFocused] = useState(false);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleAcceder = () => {
    // Se conectará con Firebase más adelante
  };

  const handleNoTengocuenta = () => {
    navigation.navigate('RegistrarCuenta');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F0EEF8" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={logo}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Bienvenida */}
          <Text style={styles.bienvenida}>BIENVENIDA</Text>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Campo Usuario */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario</Text>
              <TextInput
                style={[
                  styles.input,
                  usuarioFocused && styles.inputFocused,
                ]}
                value={usuario}
                onChangeText={setUsuario}
                onFocus={() => setUsuarioFocused(true)}
                onBlur={() => setUsuarioFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                placeholderTextColor="#C4B8DC"
              />
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.inputWrapper,
                  contrasenaFocused && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.inputInner}
                  value={contrasena}
                  onChangeText={setContrasena}
                  onFocus={() => setContrasenaFocused(true)}
                  onBlur={() => setContrasenaFocused(false)}
                  secureTextEntry={!mostrarContrasena}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleAcceder}
                  placeholderTextColor="#C4B8DC"
                />
                <TouchableOpacity
                  onPress={() => setMostrarContrasena(!mostrarContrasena)}
                  style={styles.eyeButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.eyeIcon}>
                    {mostrarContrasena ? 'Ocultar' : 'Ver'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Fila: No tengo cuenta + Acceder */}
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={handleNoTengocuenta} activeOpacity={0.7}>
              <Text style={styles.noTengoCuenta}>No tengo una cuenta</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.botonAcceder}
                onPress={handleAcceder}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
              >
                <Text style={styles.botonTexto}>Acceder</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const PURPLE_DARK = '#5B2D8E';
const PURPLE_MID = '#7B3FA8';
const BG = '#EEEAF5';
const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: height * 0.06,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: width * 0.55,
    height: width * 0.55,
    marginBottom: 0,
  },
  bienvenida: {
    fontSize: 26,
    fontWeight: '800',
    color: PURPLE_MID,
    letterSpacing: 3,
    marginBottom: 36,
    marginTop: 8,
  },
  form: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  inputGroup: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#333',
  },
  inputWrapper: {
    width: '100%',
    height: 48,
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#DDD',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputInner: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  inputFocused: {
    borderColor: PURPLE_MID,
    borderWidth: 2,
  },
  eyeButton: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  actionsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noTengoCuenta: {
    fontSize: 13,
    color: '#555',
    textDecorationLine: 'underline',
  },
  botonAcceder: {
    backgroundColor: PURPLE_MID,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 24,
    shadowColor: PURPLE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  botonTexto: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
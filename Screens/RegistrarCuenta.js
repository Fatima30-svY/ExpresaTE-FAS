import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

const CARRERAS = [
  'Ingeniería en Sistemas Computacionales',
  'Ingeniería Eléctrica',
  'Ingeniería Industrial',
  'Ingeniería Forestal',
  'Ingeniería Mecatrónica',
  'Lic. Arquitectura',
  'Lic. Gastronomía',
  'Lic. Turismo',
  'Lic. Administración',
  'Ingeniería Civil',
];

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [carrera, setCarrera] = useState('');
  const [noCuenta, setNoCuenta] = useState('');
  const [edad, setEdad] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = () => {
    if (!correo || !carrera || !noCuenta || !edad || !password || !confirmPassword) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    // Aquí conectarás con Firebase más adelante
    alert('¡Cuenta creada exitosamente!');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Encabezado */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#7C3DB8" />
        </TouchableOpacity>
        <Text style={styles.titulo}>Creación de una cuenta</Text>
      </View>

      {/* Nombre */}
      <Text style={styles.label}>Nombre <Text style={styles.opcional}>(Opcional)</Text></Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Fatima Sánchez"
        placeholderTextColor="#C0A0E0"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Correo */}
      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Correo@gmail.com"
        placeholderTextColor="#C0A0E0"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
      />

      {/* Carrera */}
      <Text style={styles.label}>Carrera</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={carrera}
          onValueChange={(val) => setCarrera(val)}
          style={styles.picker}
          dropdownIconColor="#7C3DB8"
        >
          <Picker.Item label="Selecciona tu carrera" value="" color="#C0A0E0" />
          {CARRERAS.map((c) => (
            <Picker.Item key={c} label={c} value={c} color="#2D1A4A" />
          ))}
        </Picker>
      </View>

      {/* No. de Cuenta */}
      <Text style={styles.label}>No. de Cuenta</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 202307060"
        placeholderTextColor="#C0A0E0"
        keyboardType="numeric"
        value={noCuenta}
        onChangeText={setNoCuenta}
      />

      {/* Edad */}
      <Text style={styles.label}>Edad</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 20"
        placeholderTextColor="#C0A0E0"
        keyboardType="numeric"
        value={edad}
        onChangeText={setEdad}
      />

      {/* Contraseña */}
      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputFlex}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor="#C0A0E0"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
          <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#9B72CF" />
        </TouchableOpacity>
      </View>

      {/* Confirmación */}
      <Text style={styles.label}>Confirmación de contraseña</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.inputFlex}
          placeholder="Repite tu contraseña"
          placeholderTextColor="#C0A0E0"
          secureTextEntry={!showConfirm}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
          <Ionicons name={showConfirm ? 'eye' : 'eye-off'} size={20} color="#9B72CF" />
        </TouchableOpacity>
      </View>

      {/* Botón */}
      <TouchableOpacity style={styles.boton} onPress={handleRegister}>
        <Text style={styles.botonTexto}>Registrar</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0FA',
  },
  content: {
    padding: 22,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    marginTop: Platform.OS === 'android' ? 10 : 0,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7C3DB8',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5C3D8A',
    marginBottom: 5,
    marginTop: 14,
  },
  opcional: {
    color: '#A07AC0',
    fontWeight: '400',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C0A0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D1A4A',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C0A0E0',
    overflow: 'hidden',
  },
  picker: {
    color: '#2D1A4A',
    height: 48,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C0A0E0',
    paddingHorizontal: 14,
  },
  inputFlex: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D1A4A',
  },
  eyeBtn: {
    padding: 4,
  },
  boton: {
    marginTop: 28,
    backgroundColor: '#7C3DB8',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
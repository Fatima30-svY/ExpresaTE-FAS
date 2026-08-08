import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [correo, setCorreo] = useState('');
  const [carreraId, setCarreraId] = useState('');
  const [semestreId, setSemestreId] = useState('');
  const [noCuenta, setNoCuenta] = useState('');
  const [edad, setEdad] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // catálogos que vienen de la base, no hardcodeados
  const [carreras, setCarreras] = useState([]);
  const [semestres, setSemestres] = useState([]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    const { data: dataCarreras, error: errCarreras } = await supabase
      .from('carrera')
      .select('id_carrera, nombre')
      .order('id_carrera');

    const { data: dataSemestres, error: errSemestres } = await supabase
      .from('semestre')
      .select('id_semestre, numero')
      .order('id_semestre');

    if (errCarreras || errSemestres) {
      console.log('ERROR CARRERAS:', JSON.stringify(errCarreras, null, 2));
      console.log('ERROR SEMESTRES:', JSON.stringify(errSemestres, null, 2));
      alert('No se pudieron cargar carreras/semestres. Revisa tu conexión.');
      return;
    }
    setCarreras(dataCarreras);
    setSemestres(dataSemestres);
  };

  const handleRegister = async () => {
    if (!nombre || !apellidoPaterno || !apellidoMaterno || !correo || !carreraId || !semestreId || !noCuenta || !edad || !password || !confirmPassword) {
      alert('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    // 1. Crear la cuenta de autenticación en Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: correo,
      password: password,
    });

    if (authError) {
      setLoading(false);
      alert(authError.message);
      return;
    }

    // 2. Crear el registro en la tabla usuario, ligado al auth_id
    const { error: insertError } = await supabase.from('usuario').insert({
      nombre: nombre,
      apellido_paterno: apellidoPaterno,
      apellido_materno: apellidoMaterno,
      no_control: noCuenta,
      correo: correo,
      edad: edad,
      id_carrera: carreraId,
      id_semestre: semestreId,
      auth_id: authData.user.id,
      password: '', // la contraseña real vive en Supabase Auth, aquí solo se cumple el NOT NULL
    });

    setLoading(false);

    if (insertError) {
      alert('Se creó tu cuenta, pero hubo un problema guardando tus datos: ' + insertError.message);
      return;
    }

    alert('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.');
    navigation.navigate('PantallaPrincipal');
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
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Fátima"
        placeholderTextColor="#C0A0E0"
        value={nombre}
        onChangeText={setNombre}
      />

      {/* Apellido paterno */}
      <Text style={styles.label}>Apellido paterno</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Sánchez"
        placeholderTextColor="#C0A0E0"
        value={apellidoPaterno}
        onChangeText={setApellidoPaterno}
      />

      {/* Apellido materno */}
      <Text style={styles.label}>Apellido materno</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Gómez"
        placeholderTextColor="#C0A0E0"
        value={apellidoMaterno}
        onChangeText={setApellidoMaterno}
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
          selectedValue={carreraId}
          onValueChange={(val) => setCarreraId(val)}
          style={styles.picker}
          dropdownIconColor="#7C3DB8"
        >
          <Picker.Item label="Selecciona tu carrera" value="" color="#C0A0E0" />
          {carreras.map((c) => (
            <Picker.Item key={c.id_carrera} label={c.nombre} value={c.id_carrera} color="#2D1A4A" />
          ))}
        </Picker>
      </View>

      {/* Semestre */}
      <Text style={styles.label}>Semestre</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={semestreId}
          onValueChange={(val) => setSemestreId(val)}
          style={styles.picker}
          dropdownIconColor="#7C3DB8"
        >
          <Picker.Item label="Selecciona tu semestre" value="" color="#C0A0E0" />
          {semestres.map((s) => (
            <Picker.Item key={s.id_semestre} label={`${s.numero}° semestre`} value={s.id_semestre} color="#2D1A4A" />
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
      <TouchableOpacity style={styles.boton} onPress={handleRegister} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botonTexto}>Registrar</Text>
        )}
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
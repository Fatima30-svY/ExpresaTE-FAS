import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

function getInitials(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(' ');
  if (partes.length === 1) return partes[0][0].toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

const PURPLE = '#7C3DB8';
const BG = '#F2EEF9';
const WHITE = '#FFFFFF';

const CACHE_KEY_PERFIL = 'expresate_perfil_pantalla_cache_v2';

export default function Perfil({ navigation }) {
  const [userData, setUserData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    correo: '',
    carreraNombre: '',
    idCarrera: '',
    idSemestre: '',
    semestreNumero: '',
    noControl: '',
    edad: '',
  });
  const [authId, setAuthId] = useState(null);

  const [carreras, setCarreras] = useState([]);
  const [semestres, setSemestres] = useState([]);

  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formApellidoPaterno, setFormApellidoPaterno] = useState('');
  const [formApellidoMaterno, setFormApellidoMaterno] = useState('');
  const [formNoControl, setFormNoControl] = useState('');
  const [formEdad, setFormEdad] = useState('');
  const [formIdCarrera, setFormIdCarrera] = useState('');
  const [formIdSemestre, setFormIdSemestre] = useState('');

  // Bloqueo SÍNCRONO contra doble-toque.
  const enviandoRef = useRef(false);

  useEffect(() => {
    cargarCacheInicial();
    cargarCatalogos();
  }, []);

  const cargarCacheInicial = async () => {
    try {
      const cache = await AsyncStorage.getItem(CACHE_KEY_PERFIL);
      if (cache) {
        setUserData(JSON.parse(cache));
      }
    } catch (e) {
      // si el caché falla no pasa nada, de todos modos se carga de la red
    }
  };

  const cargarCatalogos = async () => {
    const { data: dataCarreras } = await supabase
      .from('carrera')
      .select('id_carrera, nombre')
      .order('id_carrera');
    const { data: dataSemestres } = await supabase
      .from('semestre')
      .select('id_semestre, numero')
      .order('id_semestre');

    setCarreras(dataCarreras || []);
    setSemestres(dataSemestres || []);
  };

  useFocusEffect(
    useCallback(() => {
      cargarPerfil();
    }, [])
  );

  const cargarPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    console.log('[Perfil] cargarPerfil -> auth user actual:', user.id, user.email);
    setAuthId(user.id);

    const { data, error } = await supabase
      .from('usuario')
      .select('nombre, apellido_paterno, apellido_materno, correo, no_control, edad, id_carrera, id_semestre, carrera(nombre), semestre(numero)')
      .eq('auth_id', user.id)
      .single();

    console.log('[Perfil] cargarPerfil -> data:', JSON.stringify(data));
    console.log('[Perfil] cargarPerfil -> error:', JSON.stringify(error));

    if (error) {
      alert('No se pudo cargar tu perfil: ' + error.message);
      return;
    }

    const datosFormateados = {
      nombre: data.nombre || '',
      apellidoPaterno: data.apellido_paterno || '',
      apellidoMaterno: data.apellido_materno || '',
      correo: data.correo || '',
      carreraNombre: data.carrera?.nombre || '',
      idCarrera: data.id_carrera || '',
      idSemestre: data.id_semestre || '',
      semestreNumero: data.semestre?.numero || '',
      noControl: data.no_control || '',
      edad: data.edad != null ? String(data.edad) : '',
    };

    setUserData(datosFormateados);
    AsyncStorage.setItem(CACHE_KEY_PERFIL, JSON.stringify(datosFormateados)).catch(() => {});
  };

  const handleEditar = () => {
    setFormNombre(userData.nombre);
    setFormCorreo(userData.correo);
    setFormApellidoPaterno(userData.apellidoPaterno);
    setFormApellidoMaterno(userData.apellidoMaterno);
    setFormNoControl(userData.noControl);
    setFormEdad(userData.edad);
    setFormIdCarrera(userData.idCarrera);
    setFormIdSemestre(userData.idSemestre);
    setEditando(true);
  };

  const handleCancelarEdicion = () => {
    setEditando(false);
  };

  const handleGuardarCambios = async () => {
    if (enviandoRef.current) {
      console.log('[Perfil] ya hay un guardado en curso, se ignora este toque');
      return;
    }
    enviandoRef.current = true;

    console.log('[Perfil] handleGuardarCambios: inicio');

    if (
      !formNombre.trim() ||
      !formApellidoPaterno.trim() ||
      !formApellidoMaterno.trim() ||
      !formCorreo.trim() ||
      !formNoControl.trim() ||
      !formEdad.trim() ||
      !formIdCarrera ||
      !formIdSemestre
    ) {
      enviandoRef.current = false;
      alert('Completa todos los campos antes de guardar.');
      return;
    }

    setGuardando(true);

    const correoActual = userData.correo;
    const correoNuevo = formCorreo.trim();
    const correoCambio = correoNuevo !== correoActual;

    console.log('[Perfil] correo actual (BD):', JSON.stringify(correoActual));
    console.log('[Perfil] correo nuevo (form):', JSON.stringify(correoNuevo));
    console.log('[Perfil] ¿correo cambió?:', correoCambio);

    // correoParaGuardar: lo que en verdad se va a escribir en la tabla
    // `usuario`. Por default se queda como el correo actual — solo se
    // actualiza si Auth confirma que el cambio se aplicó de inmediato.
    let correoParaGuardar = correoActual;

    if (correoCambio) {
      console.log('[Perfil] llamando a supabase.auth.updateUser...');
      const { data: dataAuth, error: errorAuth } = await supabase.auth.updateUser({
        email: correoNuevo,
      });

      console.log('[Perfil] respuesta de updateUser -> email real:', dataAuth?.user?.email);
      console.log('[Perfil] respuesta de updateUser -> new_email pendiente:', dataAuth?.user?.new_email);
      console.log('[Perfil] respuesta de updateUser -> error:', JSON.stringify(errorAuth));

      if (errorAuth) {
        setGuardando(false);
        enviandoRef.current = false;
        alert(`No se pudo actualizar tu correo (${correoNuevo}): ${errorAuth.message}`);
        return;
      }

      const seAplicoDeInmediato = dataAuth?.user?.email === correoNuevo;

      if (!seAplicoDeInmediato) {
        // El cambio quedó PENDIENTE de confirmación. No tocamos la tabla
        // `usuario` para no desincronizarla con lo que Auth reconoce.
        console.log('[Perfil] el cambio quedó pendiente de confirmación, no se toca la tabla usuario');
        setGuardando(false);
        enviandoRef.current = false;
        alert(
          `Se envió un correo de confirmación a ${correoNuevo}. Debes abrirlo y confirmar antes de que el cambio se aplique — mientras tanto, tu correo de acceso sigue siendo ${correoActual}.`
        );
        setEditando(false);
        cargarPerfil();
        return;
      }

      correoParaGuardar = correoNuevo;
    }

    console.log('[Perfil] actualizando tabla usuario con correo:', correoParaGuardar);
    const { error } = await supabase
      .from('usuario')
      .update({
        nombre: formNombre.trim(),
        apellido_paterno: formApellidoPaterno.trim(),
        apellido_materno: formApellidoMaterno.trim(),
        correo: correoParaGuardar,
        no_control: formNoControl.trim(),
        edad: formEdad,
        id_carrera: formIdCarrera,
        id_semestre: formIdSemestre,
      })
      .eq('auth_id', authId);

    console.log('[Perfil] respuesta update usuario -> error:', JSON.stringify(error));

    setGuardando(false);
    enviandoRef.current = false;

    if (error) {
      alert('No se pudo guardar tus cambios: ' + error.message);
      return;
    }

    setEditando(false);

    if (correoCambio) {
      alert(`Tu correo se actualizó a ${correoParaGuardar}. Ya puedes iniciar sesión con ese correo.`);
    } else {
      alert('Tus datos se guardaron correctamente.');
    }

    console.log('[Perfil] recargando perfil...');
    cargarPerfil();
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    // Limpia el caché local del perfil para que, al iniciar sesión con
    // otra cuenta, no se alcance a ver por un instante (o quede pegado
    // si algo falla) los datos de la cuenta anterior.
    await AsyncStorage.removeItem(CACHE_KEY_PERFIL).catch(() => {});
    navigation.navigate('Login');
  };

  const handleInicio = () => {
    navigation.navigate('PantallaPrincipal');
  };

  const handleIrAReportes = () => {
    navigation.navigate('MisReportes');
  };

  const nombreCompleto = [userData.nombre, userData.apellidoPaterno, userData.apellidoMaterno]
    .filter(Boolean)
    .join(' ');

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>Mi perfil</Text>
        {!editando && (
          <TouchableOpacity style={styles.botonEditarHeader} onPress={handleEditar}>
            <Ionicons name="pencil" size={18} color={WHITE} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{getInitials(nombreCompleto)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.nombre}>{nombreCompleto || '—'}</Text>
        <Text style={styles.carreraTexto}>{userData.carreraNombre || '—'}</Text>

        {!editando ? (
          <>
            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Correo</Text>
              <Text style={styles.campoValor}>{userData.correo || '—'}</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>No. de cuenta</Text>
              <Text style={styles.campoValor}>{userData.noControl || '—'}</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Edad</Text>
              <Text style={styles.campoValor}>{userData.edad || '—'}</Text>
            </View>

            <View style={styles.campo}>
              <Text style={styles.campoLabel}>Semestre</Text>
              <Text style={styles.campoValor}>
                {userData.semestreNumero ? `${userData.semestreNumero}° semestre` : '—'}
              </Text>
            </View>

            <TouchableOpacity style={styles.botonEditar} onPress={handleEditar}>
              <Ionicons name="pencil-outline" size={16} color={PURPLE} style={{ marginRight: 6 }} />
              <Text style={styles.botonEditarTexto}>Editar información</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonCerrar} onPress={handleCerrarSesion}>
              <Text style={styles.botonCerrarTexto}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={formNombre}
              onChangeText={setFormNombre}
              placeholder="Nombre"
              placeholderTextColor="#C0A0E0"
            />

            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={formCorreo}
              onChangeText={setFormCorreo}
              placeholder="Correo"
              placeholderTextColor="#C0A0E0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Apellido paterno</Text>
            <TextInput
              style={styles.input}
              value={formApellidoPaterno}
              onChangeText={setFormApellidoPaterno}
              placeholder="Apellido paterno"
              placeholderTextColor="#C0A0E0"
            />

            <Text style={styles.label}>Apellido materno</Text>
            <TextInput
              style={styles.input}
              value={formApellidoMaterno}
              onChangeText={setFormApellidoMaterno}
              placeholder="Apellido materno"
              placeholderTextColor="#C0A0E0"
            />

            <Text style={styles.label}>Carrera</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formIdCarrera}
                onValueChange={(val) => setFormIdCarrera(val)}
                style={styles.picker}
                dropdownIconColor={PURPLE}
              >
                <Picker.Item label="Selecciona tu carrera" value="" color="#C0A0E0" />
                {carreras.map((c) => (
                  <Picker.Item key={c.id_carrera} label={c.nombre} value={c.id_carrera} color="#2D1A4A" />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Semestre</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formIdSemestre}
                onValueChange={(val) => setFormIdSemestre(val)}
                style={styles.picker}
                dropdownIconColor={PURPLE}
              >
                <Picker.Item label="Selecciona tu semestre" value="" color="#C0A0E0" />
                {semestres.map((s) => (
                  <Picker.Item key={s.id_semestre} label={`${s.numero}° semestre`} value={s.id_semestre} color="#2D1A4A" />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>No. de cuenta</Text>
            <TextInput
              style={styles.input}
              value={formNoControl}
              onChangeText={setFormNoControl}
              placeholder="No. de cuenta"
              placeholderTextColor="#C0A0E0"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Edad</Text>
            <TextInput
              style={styles.input}
              value={formEdad}
              onChangeText={setFormEdad}
              placeholder="Edad"
              placeholderTextColor="#C0A0E0"
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.botonGuardar, guardando && { opacity: 0.6 }]}
              onPress={handleGuardarCambios}
              disabled={guardando}
            >
              {guardando ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.botonGuardarTexto}>Guardar cambios</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.botonCancelar} onPress={handleCancelarEdicion} disabled={guardando}>
              <Text style={styles.botonCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.espacioTabBar} />
      </ScrollView>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={handleInicio}>
          <View style={styles.tabPill}>
            <Ionicons name="home-outline" size={22} color="#A69BB5" />
            <Text style={styles.tabLabel}>Inicio</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={handleIrAReportes}>
          <View style={styles.tabPill}>
            <Ionicons name="clipboard-outline" size={22} color="#A69BB5" />
            <Text style={styles.tabLabel}>Registro</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem}>
          <View style={[styles.tabPill, styles.tabPillActivo]}>
            <Ionicons name="person" size={22} color={PURPLE} />
            <Text style={[styles.tabLabel, styles.tabLabelActivo]}>Perfil</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: PURPLE,
    paddingTop: Platform.OS === 'android' ? 48 : 56,
    paddingBottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: WHITE },
  botonEditarHeader: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'android' ? 50 : 58,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: { alignItems: 'center', marginTop: -44, marginBottom: 8, zIndex: 10 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#C4A8E0', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE },
  avatarTexto: { fontSize: 30, fontWeight: '700', color: WHITE },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, alignItems: 'center' },
  nombre: { fontSize: 20, fontWeight: '700', color: '#1A1A2E', marginBottom: 4, textAlign: 'center' },
  carreraTexto: { fontSize: 13, color: PURPLE, marginBottom: 24, textAlign: 'center' },
  campo: { width: '100%', backgroundColor: WHITE, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
  campoLabel: { fontSize: 11, color: '#999' },
  campoValor: { fontSize: 15, color: '#1A1A2E', fontWeight: '500' },

  botonEditar: {
    marginTop: 4,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: PURPLE,
    paddingVertical: 13,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  botonEditarTexto: { color: PURPLE, fontSize: 15, fontWeight: '600' },

  botonCerrar: { marginTop: 12, width: '100%', borderRadius: 24, borderWidth: 1.5, borderColor: '#E0B0B0', paddingVertical: 13, alignItems: 'center' },
  botonCerrarTexto: { color: '#B5442E', fontSize: 15, fontWeight: '600' },

  label: {
    width: '100%',
    fontSize: 13,
    fontWeight: '500',
    color: '#5C3D8A',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C0A0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D1A4A',
  },
  pickerWrapper: {
    width: '100%',
    backgroundColor: WHITE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C0A0E0',
    overflow: 'hidden',
  },
  picker: {
    color: '#2D1A4A',
    height: 48,
  },

  botonGuardar: {
    marginTop: 22,
    width: '100%',
    backgroundColor: PURPLE,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonGuardarTexto: { color: WHITE, fontSize: 15, fontWeight: '700' },
  botonCancelar: { marginTop: 12, width: '100%', paddingVertical: 10, alignItems: 'center' },
  botonCancelarTexto: { color: '#999', fontSize: 14, fontWeight: '600' },

  espacioTabBar: { height: 80 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: Platform.OS === 'ios' ? 26 : 14,
    paddingTop: 12,
    paddingHorizontal: 10,
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    shadowColor: '#3C2066',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 14,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  tabPillActivo: { backgroundColor: '#F1E7FA' },
  tabLabel: { fontSize: 10.5, color: '#A69BB5', fontWeight: '600' },
  tabLabelActivo: { color: PURPLE, fontWeight: '700' },
});
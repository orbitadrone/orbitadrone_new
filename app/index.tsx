import React, { useState, useEffect, useCallback } from 'react';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'; // Importar iconos
import CustomButton from '../components/CustomButton';
import { Colors } from '../constants/Colors';

// Función para asignar colores a las zonas de ENAIRE según su tipo
const getZoneStyle = (zone) => {
  const type = zone?.properties?.UASZone?.type;
  switch (type) {
    case 'REQ_AUTHORIZATION': // Zonas que requieren autorización
      return { fillColor: 'rgba(255, 165, 0, 0.4)', strokeColor: 'orange' }; // Naranja para autorización
    case 'NO_FLY_ZONE': // Si hubiera zonas de no vuelo (ejemplo)
      return { fillColor: 'rgba(255, 0, 0, 0.4)', strokeColor: 'red' }; // Rojo para no vuelo
    // Puedes añadir más casos aquí si descubres otros tipos de zona en tu GeoJSON
    default:
      return { fillColor: 'rgba(128, 128, 128, 0.4)', strokeColor: 'gray' };
  }
};

export default function MapScreen() {

  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [region, setRegion] = useState({
    latitude: 41.3851,
    longitude: 2.1734,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [airspaceZones, setAirspaceZones] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Inicia en false, no hay carga inicial de GeoJSON
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLatitude, setSelectedLatitude] = useState(null);
  const [selectedLongitude, setSelectedLongitude] = useState(null);
  const [searchPois, setSearchPois] = useState([]);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isWebViewModalVisible, setIsWebViewModalVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  // Nuevos estados para las capas
  const [showAirspaceZones, setShowAirspaceZones] = useState(true); // Por defecto, mostrar zonas ENAIRE
  const [mapType, setMapType] = useState('standard'); // Por defecto, mapa estándar

  const handleClearSearchedLocations = () => {
    console.log("Antes de limpiar: searchPois.length =", searchPois.length);
    setSearchPois([]); // Limpia las ubicaciones de búsqueda reales
    console.log("Después de limpiar: searchPois.length =", searchPois.length); // Nota: Esto puede mostrar el valor antiguo debido al cierre
  };

  const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación denegado', 'Necesitamos tu permiso para acceder a la ubicación.');
        return;
      }
      setLocationPermission(true);

      let location = await Location.getCurrentPositionAsync({});
      setRegion((currentRegion) => ({
        ...currentRegion,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));
    })();
  }, []);

  useEffect(() => {
    console.log("Current Map Region:", region);
  }, [region]);

  const handleMapPress = useCallback((event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedCoordinate(coordinate);
    setSelectedZoneInfo(null);
  }, []);

  const handleVuelaSeguro = async () => {
    if (!selectedCoordinate) {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero.");
      return;
    }

    setIsLoading(true);
    console.log("Iniciando consulta al servidor de ENAIRE...");

    try {
      const response = await fetch('https://orbitadrone-enaire-api.onrender.com/api/enaire-zones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedCoordinate.latitude,
          longitude: selectedCoordinate.longitude,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.messages && data.messages.length > 0) {
          setSelectedZoneInfo(data.messages);
        } else {
          setSelectedZoneInfo(["No se encontraron zonas de ENAIRE en este punto."]);
        }
        // Establecer las zonas de espacio aéreo para visualización
        if (data.features && data.features.length > 0) {
          setAirspaceZones({ type: 'FeatureCollection', features: data.features }); // Establecer las features completas
        } else {
          setAirspaceZones(null); // Limpiar zonas si no hay
        }
      } else {
        Alert.alert("Error del servidor", data.error || "Hubo un problema al consultar las zonas de ENAIRE.");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor de ENAIRE:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor de ENAIRE. Asegúrate de que el servidor está corriendo en http://localhost:3000.");
    }
    finally {
      setIsLoading(false);
      console.log("Consulta al servidor de ENAIRE finalizada.");
    }
  };

  const handleMeteorologia = () => {
    if (selectedCoordinate) {
      setSelectedLatitude(selectedCoordinate.latitude);
      setSelectedLongitude(selectedCoordinate.longitude);
      setIsModalVisible(true);
    } else {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero para ver la meteorología.");
    }
  };
  
  // --- Lógica de Búsqueda (sin cambios) ---
  const handleSearchInArea = () => {
    if (!selectedCoordinate) {
      Alert.alert("Error", "Por favor, selecciona un punto en el mapa primero.");
      return;
    }
    setIsSearchModalVisible(true);
  };

  const performSearch = async () => {
    if (!searchText) return;
    setIsSearchModalVisible(false);
    const nominatimUrl = `${NOMINATIM_API_URL}?q=${searchText}&format=json&limit=10&bounded=1&viewbox=${region.longitude - region.longitudeDelta / 2},${region.latitude - region.latitudeDelta / 2},${region.longitude + region.longitudeDelta / 2},${region.latitude + region.latitudeDelta / 2}&countrycodes=es`;
    console.log("Nominatim URL (simplified):", nominatimUrl); // Log de la URL simplificada
    try {
      const response = await fetch(nominatimUrl, { headers: { 'User-Agent': 'OrbitadroneApp/1.0' } });
      console.log("Nominatim Response Status:", response.status); // Log del estado de la respuesta
      if (!response.ok) {
        console.error("Nominatim Response not OK:", await response.text()); // Log del cuerpo de la respuesta si no es OK
        Alert.alert("Error de búsqueda", "No se pudo obtener resultados de búsqueda. Inténtalo de nuevo.");
        return;
      }
      const data = await response.json();
      console.log("Nominatim Data:", data); // Log de los datos recibidos
      if (data && data.length > 0) {
        const newPois = data.map(item => ({
          coordinate: { latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) },
          title: item.display_name,
          description: item.type,
        }));
        setSearchPois(newPois);
        if (newPois.length > 0) {
          const firstPoi = newPois[0];
          setRegion(prevRegion => ({
            ...prevRegion,
            latitude: firstPoi.coordinate.latitude,
            longitude: firstPoi.coordinate.longitude,
            latitudeDelta: 0.0922, // Mantener un zoom similar al inicial
            longitudeDelta: 0.0421, // Mantener un zoom similar al inicial
          }));
          console.log("Nueva región del mapa establecida:", firstPoi.coordinate);
        }
        console.log("searchPois establecido después de la búsqueda:", newPois.length, "elementos.");
      } else {
        setSearchPois([]);
        console.log("No se encontraron resultados de búsqueda.");
      }
    } catch (error) {
      console.error("Error al buscar en Nominatim:", error);
      Alert.alert("Error de conexión", "No se pudo conectar con el servicio de búsqueda. Verifica tu conexión a internet.");
    }
  };
  // --- Fin Lógica de Búsqueda ---

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedLatitude(null);
    setSelectedLongitude(null);
  };

  const handleCancel = () => {
    setSelectedCoordinate(null);
    setAirspaceZones(null);
    setIsSearchModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        mapType={mapType} // Conectar el tipo de mapa al estado
      >
        {showAirspaceZones && airspaceZones && airspaceZones.features.map((zone, index) => ( // Condicional para mostrar zonas ENAIRE
          <Geojson
            key={index}
            geojson={{ type: 'FeatureCollection', features: [zone] }}
            strokeColor={getZoneStyle(zone).strokeColor}
            fillColor={getZoneStyle(zone).fillColor}
            strokeWidth={1}
          />
        ))}
        {selectedCoordinate && <Marker coordinate={selectedCoordinate} pinColor="green" />}
        {console.log("Rendering searchPois:", searchPois.length, "items.", searchPois[0])}
        {searchPois.map((poi, index) => (
          <Marker
            key={`search-poi-${index}`}
            coordinate={poi.coordinate}
            title={poi.title}
            description={poi.description}
            pinColor="purple"
            onPress={() => {
              const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(poi.title)}`;
              console.log('Marker pressed. Google Search URL:', googleSearchUrl);
              setWebViewUrl(googleSearchUrl);
              setIsWebViewModalVisible(true);
              console.log('isWebViewModalVisible set to true.');
            }}
          />
        ))}
      </MapView>

      {/* Contenedor para los iconos de capa */}
      <View style={styles.layerButtonsContainer}>
        <TouchableOpacity
          style={styles.layerButton}
          onPress={() => setShowAirspaceZones(!showAirspaceZones)}
        >
          <MaterialCommunityIcons
            name={showAirspaceZones ? "eye" : "eye-off"}
            size={24}
            color="black"
          />
          <Text style={styles.layerButtonText}>ENAIRE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.layerButton}
          onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
        >
          <MaterialIcons
            name={mapType === 'standard' ? "satellite" : "map"}
            size={24}
            color="black"
          />
          <Text style={styles.layerButtonText}>{mapType === 'standard' ? "Satélite" : "Estándar"}</Text>
        </TouchableOpacity>
      </View>

      {(isLoading) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Consultando...</Text>
        </View>
      )}

      {selectedCoordinate && (
        <View style={styles.optionsPanel}>
          <Text style={styles.panelTitle}>Opciones del Punto</Text>
          <View style={styles.buttonRow}>
            <CustomButton title="Vuela Seguro" onPress={handleVuelaSeguro} color="#5FD9FF" />
            <CustomButton title="Meteorología" onPress={handleMeteorologia} color="#5FD9FF" />
            <CustomButton title="Buscar en esta zona" onPress={handleSearchInArea} color="#5FD9FF" />
          </View>
          <View style={styles.cancelButton}>
            <CustomButton title="Cancelar" onPress={handleCancel} color="#FF4F4F" />
          </View>
        </View>
      )}

      {airspaceZones && !isLoading && (
        <TouchableOpacity style={styles.clearButton} onPress={() => setAirspaceZones(null)}>
          <Text style={styles.clearButtonText}>Limpiar zonas ENAIRE</Text>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={selectedZoneInfo !== null}
        onRequestClose={() => setSelectedZoneInfo(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalles de la Zona</Text>
            <ScrollView style={styles.modalScrollView}>
              {selectedZoneInfo && selectedZoneInfo.map((message, index) => (
                <Text key={index} style={styles.zoneMessage}>{message.replace(/<[^>]+>/g, '')}</Text>
              ))}
            </ScrollView>
            <CustomButton title="Cerrar" onPress={() => setSelectedZoneInfo(null)} color={Colors.light.tint} />
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedLatitude !== null && selectedLongitude !== null ? (
              <WeatherDisplay latitude={selectedLatitude} longitude={selectedLongitude} onClose={handleCloseModal} />
            ) : (
              <Text>Selecciona una ubicación para ver el clima.</Text>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isSearchModalVisible}
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buscar en esta zona</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Introduce tu búsqueda (ej. restaurantes)"
              value={searchText}
              onChangeText={setSearchText}
            />
            <View style={styles.buttonRow}>
              <CustomButton title="Buscar" onPress={performSearch} color="#5FD9FF" />
              <CustomButton title="Cancelar" onPress={() => setIsSearchModalVisible(false)} color="#FF4F4F" />
            </View>
            <View style={styles.quickSearchButtons}>
              <Text style={styles.quickSearchTitle}>Búsquedas rápidas:</Text>
              <View style={styles.buttonRow}>
                <CustomButton title="Restaurantes" onPress={() => { setSearchText('restaurantes'); performSearch(); }} color="#5FFF69" />
                <CustomButton title="Farmacias" onPress={() => { setSearchText('farmacias'); performSearch(); }} color="#5FFF69" />
                <CustomButton title="Gasolineras" onPress={() => { setSearchText('gasolineras'); performSearch(); }} color="#5FFF69" />
                <CustomButton title="Hoteles" onPress={() => { setSearchText('hoteles'); performSearch(); }} color="#5FFF69" />
                <CustomButton title="Camping" onPress={() => { setSearchText('camping'); performSearch(); }} color="#5FFF69" />
                <CustomButton title="Parking de autocaravanas" onPress={() => { setSearchText('zona de autocaravanas'); performSearch(); }} color="#5FFF69" />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isWebViewModalVisible}
        onRequestClose={() => setIsWebViewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.webViewModalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsWebViewModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </TouchableOpacity>
            {webViewUrl ? (
              <WebView 
                source={{ uri: webViewUrl }}
                style={{ flex: 1, width: '100%', backgroundColor: 'white' }}
                onLoad={() => console.log('WebView loaded successfully.')}
                onLoadError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('WebView loading error:', nativeEvent.code, nativeEvent.description, nativeEvent.url);
                }}
              />
            ) : (
              <Text>No URL to display.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Botón Limpiar Búsqueda */}
      {searchPois.length > 0 && (
        <TouchableOpacity style={styles.clearSearchButtonContainer} onPress={handleClearSearchedLocations}>
          <Text style={styles.clearButtonText}>Limpiar Búsqueda</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  optionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 30, 30, 0.4)',
    padding: 20,
    paddingBottom: 40, // Añadido para evitar superposición con botones de navegación
    borderTopLeftRadius: 30, // Más redondeado
    borderTopRightRadius: 30, // Más redondeado
    elevation: 10,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Permite que los elementos se envuelvan a la siguiente línea
    justifyContent: 'center', // Centra los botones
    gap: 10, // Espacio entre los botones
    marginBottom: 15,
  },
  cancelButton: {
    marginTop: 10,
  },
  clearButton: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
    elevation: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%', // Restaurado
    backgroundColor: 'rgba(30, 30, 30, 0.4)',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'white',
  },
  modalScrollView: {
    flexGrow: 0,
  },
  zoneMessage: {
    marginBottom: 10,
    color: 'white',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20, // Para hacerlo circular
    backgroundColor: '#FF4F4F', // Color rojo
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Asegura que esté sobre el WebView
  },
  closeButtonText: {
    // Este estilo ya no es necesario para el texto, pero lo mantengo por si acaso
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    width: '100%',
  },
  // Nuevo estilo para el modal de WebView
  webViewModalContent: {
    width: '95%',
    height: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
  },
  webViewCloseButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 999,
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'lightgray',
  },
  // Nuevos estilos para los botones de capa
  layerButtonsContainer: {
    position: 'absolute',
    top: 60, // Ajusta según sea necesario para que no se superponga con la barra de estado
    left: 10,
    flexDirection: 'column', // Apila los botones verticalmente
    gap: 10, // Espacio entre los botones
  },
  layerButton: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: 8,
    elevation: 5, // Sombra para que se vea elevado
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerButtonText: {
    marginLeft: 5,
    fontSize: 12,
  },
  clearSearchButtonContainer: {
    position: 'absolute',
    top: 120, // Posicionado debajo de Limpiar Zonas (60 + ~50 de altura + 10 de margen)
    right: 10, // Alineado a la derecha con Limpiar Zonas
    zIndex: 10, // Asegura que esté sobre el mapa y otros elementos
    backgroundColor: 'rgba(255, 255, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
    elevation: 10,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
});

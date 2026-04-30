import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutChangeEvent,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { API_BASE_URL } from '@/constants/api';
import type { Artesania, ArtesaniaPayload } from '@/types/artesania';

type SelectedImage = {
  uri: string;
  name: string;
  mimeType: string;
  file?: File;
};

const initialForm: ArtesaniaPayload = {
  nombre: '',
  artesana: '',
  precio: '',
  categoria: '',
  imagen_url: '',
};

export default function CrudScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const formPanelY = useRef(0);
  const [items, setItems] = useState<Artesania[]>([]);
  const [form, setForm] = useState<ArtesaniaPayload>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) =>
      [String(item.id), item.nombre, item.artesana, item.categoria].some((value) =>
        value.toLowerCase().includes(term)
      )
    );
  }, [items, query]);

  const categories = useMemo(() => {
    const unique = new Set(items.map((item) => item.categoria));

    if (form.categoria.trim()) {
      unique.add(form.categoria.trim());
    }

    return Array.from(unique);
  }, [items, form.categoria]);

  const totalValue = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.precio), 0),
    [items]
  );

  const previewImage = selectedImage?.uri || form.imagen_url || '';

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const isFormData = options?.body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: isFormData
        ? options?.headers
        : {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error ?? 'No fue posible completar la solicitud');
    }

    return data as T;
  }

  const loadItems = useCallback(async (showRefresh = false) => {
    try {
      setError('');
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await request<Artesania[]>('/artesanias-wayuu');
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar artesanias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  function updateField(field: keyof ArtesaniaPayload, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setSelectedImage(null);
  }

  function handleFormPanelLayout(event: LayoutChangeEvent) {
    formPanelY.current = event.nativeEvent.layout.y;
  }

  function scrollToForm() {
    scrollRef.current?.scrollTo({
      y: Math.max(formPanelY.current - 16, 0),
      animated: true,
    });
  }

  function startEdit(item: Artesania) {
    setEditingId(item.id);
    setSelectedImage(null);
    setForm({
      nombre: item.nombre,
      artesana: item.artesana,
      precio: String(item.precio),
      categoria: item.categoria,
      imagen_url: item.imagen_url || '',
    });
    scrollToForm();
  }

  function validateForm() {
    if (
      !form.nombre.trim() ||
      !form.artesana.trim() ||
      !form.precio.trim() ||
      !form.categoria.trim()
    ) {
      throw new Error('Completa todos los campos');
    }

    const parsedPrice = Number(form.precio);

    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new Error('El precio debe ser un numero mayor que cero');
    }

    if (!editingId && !selectedImage) {
      throw new Error('Debes subir una imagen para crear el producto');
    }

    return {
      nombre: form.nombre.trim(),
      artesana: form.artesana.trim(),
      precio: parsedPrice,
      categoria: form.categoria.trim(),
    };
  }

  async function pickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        throw new Error('Debes conceder permiso para acceder a tus imagenes');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setSelectedImage({
        uri: asset.uri,
        name: asset.fileName || `artesania-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        file: asset.file,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo seleccionar la imagen');
    }
  }

  function buildFormData(payload: {
    nombre: string;
    artesana: string;
    precio: number;
    categoria: string;
  }) {
    const data = new FormData();
    data.append('nombre', payload.nombre);
    data.append('artesana', payload.artesana);
    data.append('precio', String(payload.precio));
    data.append('categoria', payload.categoria);

    if (selectedImage) {
      if (Platform.OS === 'web' && selectedImage.file) {
        data.append('imagen', selectedImage.file, selectedImage.name);
      } else {
        data.append('imagen', {
          uri: selectedImage.uri,
          name: selectedImage.name,
          type: selectedImage.mimeType,
        } as never);
      }
    }

    return data;
  }

  async function submitForm() {
    try {
      setSubmitting(true);
      setError('');
      const payload = validateForm();
      const body = buildFormData(payload);

      if (editingId) {
        const response = await request<{ artesania: Artesania }>(
          `/artesanias-wayuu/${editingId}`,
          {
            method: 'PUT',
            body,
          }
        );

        setItems((current) =>
          current.map((item) => (item.id === editingId ? response.artesania : item))
        );
      } else {
        const response = await request<{ artesania: Artesania }>('/artesanias-wayuu', {
          method: 'POST',
          body,
        });

        setItems((current) => [response.artesania, ...current]);
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la artesania');
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteItem(id: number) {
    try {
      setDeletingId(id);
      setError('');
      await request(`/artesanias-wayuu/${id}`, { method: 'DELETE' });
      setItems((current) => current.filter((item) => item.id !== id));

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la artesania');
    } finally {
      setDeletingId(null);
    }
  }

  function confirmDelete(id: number) {
    if (Platform.OS === 'web') {
      const confirmed = globalThis.confirm('Esta artesania se eliminara permanentemente.');
      if (confirmed) {
        deleteItem(id);
      }
      return;
    }

    Alert.alert('Eliminar artesania', 'Esta artesania se eliminara permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteItem(id) },
    ]);
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadItems(true)}
          tintColor="#B66A2C"
        />
      }>
      <View style={styles.hero}>
        <Text style={styles.kicker}>ARTESANIAS WAYUU</Text>
        <Text style={styles.title}>Crea y edita productos con imagen incluida.</Text>
        <Text style={styles.subtitle}>
          API conectada a <Text style={styles.inlineStrong}>{API_BASE_URL}</Text>
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Piezas" value={String(items.length)} />
        <StatCard label="Filtradas" value={String(filteredItems.length)} />
        <StatCard label="Valor total" value={formatCurrency(totalValue)} />
      </View>

      <View style={styles.panel} onLayout={handleFormPanelLayout}>
        <Text style={styles.panelTitle}>
          {editingId ? 'Editar artesania' : 'Nueva artesania'}
        </Text>

        <View style={styles.formGrid}>
          <Field
            label="Nombre"
            placeholder="Mochila premium"
            value={form.nombre}
            onChangeText={(value) => updateField('nombre', value)}
          />
          <Field
            label="Artesana(o)"
            placeholder="Nombre de la artesana"
            value={form.artesana}
            onChangeText={(value) => updateField('artesana', value)}
          />
          <Field
            label="Precio"
            placeholder="120000"
            keyboardType="numeric"
            value={form.precio}
            onChangeText={(value) => updateField('precio', value)}
          />
          <Field
            label="Categoria"
            placeholder="Mochilas"
            value={form.categoria}
            onChangeText={(value) => updateField('categoria', value)}
          />
        </View>

        <View style={styles.imagePanel}>
          <Text style={styles.fieldLabel}>Imagen del producto</Text>
          <Pressable style={styles.uploadButton} onPress={pickImage}>
            <Text style={styles.uploadButtonText}>
              {previewImage ? 'Cambiar imagen' : 'Subir imagen'}
            </Text>
          </Pressable>

          {previewImage ? (
            <View style={styles.previewGallery}>
              <View style={styles.previewThumbCard}>
                <Text style={styles.previewCardLabel}>Vista previa</Text>
                <Image
                  source={{ uri: previewImage }}
                  style={styles.previewThumbImage}
                  resizeMode="cover"
                />
              </View>
            </View>
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.previewPlaceholderText}>
                La imagen se cargara aqui despues de seleccionarla.
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.categoryChip,
                form.categoria === category && styles.categoryChipActive,
              ]}
              onPress={() => updateField('categoria', category)}>
              <Text
                style={[
                  styles.categoryChipText,
                  form.categoria === category && styles.categoryChipTextActive,
                ]}>
                {category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            disabled={submitting}
            onPress={submitForm}>
            <Text style={styles.primaryButtonText}>
              {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
            </Text>
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={resetForm}>
            <Text style={styles.secondaryButtonText}>Limpiar</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.listHeader}>
          <Text style={styles.panelTitle}>Inventario</Text>
          <Pressable style={styles.refreshLink} onPress={() => loadItems(true)}>
            <Text style={styles.refreshLinkText}>Recargar</Text>
          </Pressable>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por id, nombre, artesana o categoria"
          placeholderTextColor="#98785B"
          style={styles.searchInput}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#B66A2C" />
            <Text style={styles.loadingText}>Cargando artesanias...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No hay resultados</Text>
            <Text style={styles.emptySubtitle}>
              Ajusta la busqueda o crea una nueva artesania.
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filteredItems.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemCardContent}>
                  <View style={styles.itemInfoColumn}>
                    <View style={styles.itemTopRow}>
                      <View style={styles.itemMetaGroup}>
                        <View style={styles.itemIdBadge}>
                          <Text style={styles.itemIdBadgeText}>ID {item.id}</Text>
                        </View>
                        <View style={styles.itemBadge}>
                          <Text style={styles.itemBadgeText}>{item.categoria}</Text>
                        </View>
                      </View>
                      <Text style={styles.itemPrice}>{formatCurrency(Number(item.precio))}</Text>
                    </View>

                    <Text style={styles.itemTitle}>{item.nombre}</Text>
                    <Text style={styles.itemAuthor}>Por {item.artesana}</Text>

                    <View style={styles.itemActions}>
                      <Pressable style={styles.editButton} onPress={() => startEdit(item)}>
                        <Text style={styles.editButtonText}>Editar</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.deleteButton,
                          deletingId === item.id && styles.buttonDisabled,
                        ]}
                        disabled={deletingId === item.id}
                        onPress={() => confirmDelete(item.id)}>
                        <Text style={styles.deleteButtonText}>
                          {deletingId === item.id ? 'Eliminando...' : 'Eliminar'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.itemImageColumn}>
                    {item.imagen_url ? (
                      <Image
                        source={{ uri: item.imagen_url }}
                        style={styles.itemImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.itemImagePlaceholder}>
                        <Text style={styles.itemImagePlaceholderText}>Sin imagen</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#98785B"
        style={styles.input}
        autoCapitalize="sentences"
        {...props}
      />
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5E8D2',
  },
  content: {
    padding: 18,
    gap: 18,
    paddingBottom: 34,
  },
  hero: {
    backgroundColor: '#1F3B2C',
    borderRadius: 28,
    padding: 22,
    gap: 10,
  },
  kicker: {
    color: '#DDBA7A',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF8EE',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    color: '#E7D6BF',
    fontSize: 14,
    lineHeight: 20,
  },
  inlineStrong: {
    fontWeight: '700',
    color: '#FFF4E1',
  },
  statsRow: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFF9F1',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D0B3',
  },
  statLabel: {
    color: '#6A4A2C',
    fontSize: 13,
    marginBottom: 6,
  },
  statValue: {
    color: '#1E1B18',
    fontSize: 24,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: '#FFF9F1',
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5D0B3',
  },
  panelTitle: {
    color: '#2B2118',
    fontSize: 22,
    fontWeight: '800',
  },
  formGrid: {
    gap: 14,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: '#6A4A2C',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0C09A',
    color: '#1F1A16',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  imagePanel: {
    gap: 10,
  },
  uploadButton: {
    backgroundColor: '#1F3B2C',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFF8EE',
    fontSize: 15,
    fontWeight: '800',
  },
  previewImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#E7D6BF',
  },
  previewGallery: {
    gap: 12,
  },
  previewThumbCard: {
    width: 156,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F8EAD7',
    borderWidth: 1,
    borderColor: '#E0C09A',
    gap: 8,
  },
  previewCardLabel: {
    color: '#6A4A2C',
    fontSize: 13,
    fontWeight: '800',
  },
  previewThumbImage: {
    width: '100%',
    height: 118,
    borderRadius: 14,
    backgroundColor: '#E7D6BF',
  },
  previewPlaceholder: {
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C89C6D',
    padding: 24,
    backgroundColor: '#F8EAD7',
  },
  previewPlaceholderText: {
    color: '#6A4A2C',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryRow: {
    gap: 10,
  },
  categoryChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F7E5CB',
  },
  categoryChipActive: {
    backgroundColor: '#B66A2C',
  },
  categoryChipText: {
    color: '#6A4A2C',
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#FFF8EE',
  },
  errorText: {
    color: '#A32020',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#B66A2C',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF8EE',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    minWidth: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C89C6D',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#6A4A2C',
    fontSize: 15,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refreshLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshLinkText: {
    color: '#B66A2C',
    fontWeight: '800',
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0C09A',
    color: '#1F1A16',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6A4A2C',
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#F8EAD7',
    borderRadius: 20,
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    color: '#2B2118',
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#6A4A2C',
    lineHeight: 20,
  },
  cardList: {
    gap: 14,
  },
  itemCard: {
    backgroundColor: '#F8EAD7',
    borderRadius: 20,
    padding: 16,
  },
  itemCardContent: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'stretch',
  },
  itemInfoColumn: {
    flex: 1,
    gap: 10,
    justifyContent: 'space-between',
  },
  itemImageColumn: {
    width: 122,
    minHeight: 140,
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: '#EAD7BC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  itemImagePlaceholderText: {
    color: '#7B624A',
    fontWeight: '700',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: '#FFF4E1',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  itemMetaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  itemIdBadge: {
    backgroundColor: '#E7D6BF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  itemIdBadgeText: {
    color: '#6A4A2C',
    fontSize: 12,
    fontWeight: '800',
  },
  itemBadge: {
    backgroundColor: '#1F3B2C',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  itemBadgeText: {
    color: '#E7D6BF',
    fontSize: 12,
    fontWeight: '800',
  },
  itemPrice: {
    color: '#B66A2C',
    fontSize: 18,
    fontWeight: '800',
  },
  itemTitle: {
    color: '#2B2118',
    fontSize: 19,
    fontWeight: '800',
  },
  itemAuthor: {
    color: '#6A4A2C',
    fontSize: 14,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1F3B2C',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF8EE',
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#D95D39',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF8EE',
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
});

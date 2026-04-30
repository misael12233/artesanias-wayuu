import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '@/constants/api';
import type { Artesania } from '@/types/artesania';

export default function SummaryScreen() {
  const [items, setItems] = useState<Artesania[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/artesanias-wayuu`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'No se pudo cargar el resumen');
        }

        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, { total: number; stock: number }>();

    for (const item of items) {
      const current = map.get(item.categoria) ?? { total: 0, stock: 0 };
      current.total += Number(item.precio);
      current.stock += 1;
      map.set(item.categoria, current);
    }

    return [...map.entries()].sort((a, b) => b[1].stock - a[1].stock);
  }, [items]);

  const topItem = useMemo(() => {
    return [...items].sort((a, b) => Number(b.precio) - Number(a.precio))[0] ?? null;
  }, [items]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Resumen</Text>
        <Text style={styles.title}>Lectura rapida del inventario wayuu.</Text>
        <Text style={styles.subtitle}>
          Esta vista consume la misma API y sirve para validar que el CRUD ya esta integrado.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#B66A2C" />
          <Text style={styles.loadingText}>Preparando resumen...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>No se pudo cargar el resumen</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <Metric label="Categorias activas" value={String(grouped.length)} />
            <Metric label="Pieza mas costosa" value={topItem ? topItem.nombre : 'Sin datos'} />
            <Metric
              label="Precio mas alto"
              value={topItem ? formatCurrency(Number(topItem.precio)) : '$0'}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.stack}>
              {grouped.map(([category, data]) => (
                <View key={category} style={styles.categoryCard}>
                  <View>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryMeta}>{data.stock} piezas</Text>
                  </View>
                  <Text style={styles.categoryTotal}>{formatCurrency(data.total)}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
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
  header: {
    backgroundColor: '#A33E2B',
    borderRadius: 28,
    padding: 22,
    gap: 10,
  },
  kicker: {
    color: '#FFD9B8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF8EE',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: '#FFE7D1',
    lineHeight: 20,
  },
  loadingBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 36,
  },
  loadingText: {
    color: '#6A4A2C',
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFF1EE',
    borderColor: '#E6A79C',
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  errorTitle: {
    color: '#7C2518',
    fontWeight: '800',
    fontSize: 18,
  },
  errorText: {
    color: '#9C3526',
  },
  heroCard: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFF9F1',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5D0B3',
  },
  metricLabel: {
    color: '#6A4A2C',
    fontSize: 13,
    marginBottom: 6,
  },
  metricValue: {
    color: '#2B2118',
    fontSize: 22,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#FFF9F1',
    borderRadius: 24,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5D0B3',
  },
  sectionTitle: {
    color: '#2B2118',
    fontSize: 22,
    fontWeight: '800',
  },
  stack: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#F8EAD7',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  categoryName: {
    color: '#2B2118',
    fontSize: 18,
    fontWeight: '800',
  },
  categoryMeta: {
    color: '#6A4A2C',
    marginTop: 4,
  },
  categoryTotal: {
    color: '#B66A2C',
    fontSize: 16,
    fontWeight: '800',
  },
});

/**
 * Flyer de evento. Con URL renderiza la imagen; sin ella, el placeholder de
 * marca (trama carmín sobre obsidian + chip rotulado, espejo de `.rv-img-ph`).
 */
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color, radius } from '../lib/theme';

export function Flyer({
  url,
  aspectRatio = 4 / 5,
  borderRadius = radius.lg,
}: {
  url: string | null;
  aspectRatio?: number;
  borderRadius?: number;
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={[styles.image, { aspectRatio, borderRadius }]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.placeholder, { aspectRatio, borderRadius }]}>
      <LinearGradient
        colors={['rgba(227, 23, 50, 0.16)', 'rgba(227, 23, 50, 0.03)', 'transparent']}
        start={{ x: 0.2, y: 0.15 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.labelChip}>
        <Text style={styles.labelText}>SIN FLYER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    backgroundColor: color.bgSurface,
  },
  placeholder: {
    width: '100%',
    backgroundColor: color.bgSurface,
    borderWidth: 1,
    borderColor: color.borderFaint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  labelChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(163, 168, 179, 0.2)',
    backgroundColor: 'rgba(9, 9, 13, 0.7)',
  },
  labelText: {
    fontSize: 11,
    letterSpacing: 1,
    color: 'rgba(163, 168, 179, 0.6)',
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
});

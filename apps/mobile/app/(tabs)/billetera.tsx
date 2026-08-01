/** Billetera: estado vacío de marca. Las entradas llegan con la sesión nativa (SD-06 TO-BE). */
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { color, radius, space, type } from '../../lib/theme';
import { Button, Eyebrow } from '../../components/ui';

export default function WalletScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Eyebrow>Billetera</Eyebrow>
        <Text style={styles.title}>Tus entradas</Text>
      </View>
      <View style={styles.emptyBox}>
        <View style={styles.iconRing}>
          <Ionicons name="ticket-outline" size={40} color={color.smoke} />
        </View>
        <Text style={styles.emptyTitle}>Tus entradas vivirán aquí</Text>
        <Text style={styles.emptySubtitle}>
          Compra desde la web y muy pronto podrás llevar tu QR en el teléfono,
          incluso sin señal en la puerta.
        </Text>
        <Button
          label="Explorar eventos"
          onPress={() => router.push('/eventos')}
          style={styles.action}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: color.bgRoot,
  },
  header: {
    padding: space.s4,
    gap: space.s2,
  },
  title: {
    ...type.h1,
    color: color.textPrimary,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s8,
    gap: space.s3,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.s2,
  },
  emptyTitle: {
    ...type.h3,
    color: color.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...type.bodySm,
    color: color.textMuted,
    textAlign: 'center',
  },
  action: {
    marginTop: space.s4,
  },
});

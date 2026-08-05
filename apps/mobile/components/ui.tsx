/** Primitivos de UI del DS RAVENUE (espejo móvil de @urnight/ui). */
import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { color, radius, space, type } from '../lib/theme';

/** Eyebrow en mayúsculas espaciadas (labels de sección). */
export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function SectionHead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

/** Pill oscura con hairline; activa = tinte carmín (chip de filtro del DS). */
export function Chip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'secondary' && styles.buttonTextSecondary,
          disabled && styles.buttonTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Campo de formulario del DS: label + input oscuro + mensaje de error (espejo de FormField web). */
export function Field({
  label,
  error,
  ...inputProps
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={color.textFaint}
        style={[styles.fieldInput, error ? styles.fieldInputError : null]}
        {...inputProps}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function LoadingState({ label = 'Cargando la noche…' }: { label?: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={color.crimson} size="large" />
      <Text style={styles.stateSubtitle}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message = 'No pudimos conectar con Ravenue.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateTitle}>Sin conexión</Text>
      <Text style={styles.stateSubtitle}>{message}</Text>
      {onRetry ? (
        <Button label="Reintentar" onPress={onRetry} variant="secondary" style={styles.stateAction} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateSubtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.stateAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.eyebrow,
    color: color.smoke,
    textTransform: 'uppercase',
  },
  sectionHead: {
    gap: space.s1,
    marginBottom: space.s3,
  },
  sectionTitle: {
    ...type.h3,
    color: color.textPrimary,
  },
  sectionSubtitle: {
    ...type.bodySm,
    color: color.textMuted,
  },
  chip: {
    height: 34,
    paddingHorizontal: space.s4 - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.borderSoft,
    backgroundColor: color.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: color.accentSoftStrong,
    borderColor: color.accentBorder,
  },
  chipText: {
    ...type.label,
    color: color.textSecondary,
  },
  chipTextActive: {
    color: color.textOnAccent,
  },
  button: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s6,
  },
  buttonPrimary: {
    backgroundColor: color.crimson,
  },
  buttonSecondary: {
    backgroundColor: color.secondaryFill,
    borderWidth: 1,
    borderColor: color.steel,
  },
  buttonDisabled: {
    backgroundColor: color.bgElevated,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    ...type.label,
    fontSize: 15,
    color: color.textOnAccent,
  },
  buttonTextSecondary: {
    color: color.textPrimary,
  },
  buttonTextDisabled: {
    color: color.textFaint,
  },
  field: {
    gap: space.s2 - 2,
  },
  fieldLabel: {
    ...type.label,
    color: color.textSecondary,
  },
  fieldInput: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.steel,
    backgroundColor: color.fieldBg,
    paddingHorizontal: space.s4 - 2,
    ...type.body,
    lineHeight: undefined,
    color: color.textPrimary,
  },
  fieldInputError: {
    borderColor: color.error,
  },
  fieldError: {
    ...type.caption,
    color: color.errorFg,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.s16,
    paddingHorizontal: space.s8,
    gap: space.s2,
  },
  stateTitle: {
    ...type.h3,
    color: color.textPrimary,
    textAlign: 'center',
  },
  stateSubtitle: {
    ...type.bodySm,
    color: color.textMuted,
    textAlign: 'center',
  },
  stateAction: {
    marginTop: space.s4,
    alignSelf: 'center',
  },
});

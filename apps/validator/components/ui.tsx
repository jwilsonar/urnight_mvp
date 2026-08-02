/** Primitivos de UI del DS RAVENUE para la app de puerta (subconjunto del espejo de apps/mobile). */
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

/** Pill oscura con hairline; el tono lo decide el llamador (estado de red). */
export function Chip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <View
      style={[
        styles.chip,
        tone === 'success' && styles.chipSuccess,
        tone === 'warning' && styles.chipWarning,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          tone === 'success' && styles.chipTextSuccess,
          tone === 'warning' && styles.chipTextWarning,
        ]}
      >
        {label}
      </Text>
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

/** Campo de formulario del DS: label + input oscuro + mensaje de error. */
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

export function LoadingState({ label = 'Abriendo la puerta…' }: { label?: string }) {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={color.crimson} size="large" />
      <Text style={styles.stateSubtitle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...type.eyebrow,
    color: color.smoke,
    textTransform: 'uppercase',
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
    alignSelf: 'flex-start',
  },
  chipSuccess: {
    backgroundColor: color.successSoft,
    borderColor: color.success,
  },
  chipWarning: {
    backgroundColor: color.warningSoft,
    borderColor: color.warning,
  },
  chipText: {
    ...type.label,
    color: color.textSecondary,
  },
  chipTextSuccess: {
    color: color.successFg,
  },
  chipTextWarning: {
    color: color.warningFg,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.s8,
    gap: space.s2,
    backgroundColor: color.bgRoot,
  },
  stateSubtitle: {
    ...type.bodySm,
    color: color.textMuted,
    textAlign: 'center',
  },
});

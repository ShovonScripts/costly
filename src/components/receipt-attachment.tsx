import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveReceiptLocally } from '@/utils/receipt';

type ReceiptAttachmentProps = {
  receiptUri?: string;
  onChange: (uri: string | undefined) => void;
};

export function ReceiptAttachment({ receiptUri, onChange }: ReceiptAttachmentProps) {
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const permissionResult = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please grant permission to attach receipt photos.');
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const localUri = await saveReceiptLocally(result.assets[0].uri);
        onChange(localUri);
      }
    } catch {
      Alert.alert('Error', 'Could not load image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const showSourceOptions = () => {
    Alert.alert(
      'Attach Receipt',
      'Choose receipt source',
      [
        { text: 'Take Photo', onPress: () => void pickImage(true) },
        { text: 'Choose from Gallery', onPress: () => void pickImage(false) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {receiptUri ? (
        <View style={[styles.previewCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Image source={{ uri: receiptUri }} style={styles.thumbnail} contentFit="cover" />
          <View style={styles.previewInfo}>
            <ThemedText type="smallBold">Receipt attached</ThemedText>
            <View style={styles.previewActions}>
              <Pressable onPress={showSourceOptions} disabled={isProcessing} style={styles.actionButton}>
                <ThemedText type="caption" style={{ color: theme.accent }}>Change</ThemedText>
              </Pressable>
              <Pressable onPress={() => onChange(undefined)} disabled={isProcessing} style={styles.actionButton}>
                <ThemedText type="caption" themeColor="danger">Remove</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={showSourceOptions}
          disabled={isProcessing}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: theme.cardMuted, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>📷  Add receipt photo</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Optional</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  addButton: {
    minHeight: 52,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.two,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Radius.medium,
  },
  previewInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  previewActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    paddingVertical: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});

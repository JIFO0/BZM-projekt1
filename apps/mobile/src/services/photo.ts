import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export async function pickPhotoAsync(
  source: 'camera' | 'library',
  locale = 'pl'
): Promise<string | null> {
  try {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          locale === 'pl' ? 'Uprawnienia aparatu' : 'Camera permission',
          locale === 'pl'
            ? 'Wymagany jest dostęp do aparatu, aby zrobić zdjęcie barierze.'
            : 'Camera access is required to take a photo of the barrier.'
        );
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]!;
        return asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          locale === 'pl' ? 'Uprawnienia galerii' : 'Gallery permission',
          locale === 'pl'
            ? 'Wymagany jest dostęp do galerii zdjęć.'
            : 'Gallery access is required to select a photo.'
        );
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]!;
        return asset.base64
          ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`
          : asset.uri;
      }
    }
  } catch (err: any) {
    Alert.alert(
      locale === 'pl' ? 'Błąd zdjęcia' : 'Photo error',
      err.message || 'Nie udało się wybrać zdjęcia.'
    );
  }
  return null;
}

import * as FileSystem from 'expo-file-system';

export async function saveReceiptLocally(tempUri: string): Promise<string> {
  try {
    const filename = `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.jpg`;
    const baseDir = (FileSystem as any).documentDirectory ?? (FileSystem as any).cacheDirectory;
    if (!baseDir) return tempUri;
    const destUri = `${baseDir}${filename}`;
    await FileSystem.copyAsync({ from: tempUri, to: destUri });
    return destUri;
  } catch {
    return tempUri;
  }
}

export async function deleteLocalReceipt(uri: string): Promise<void> {
  try {
    if (uri && uri.startsWith('file://')) {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

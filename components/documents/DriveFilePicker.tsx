// components/documents/DriveFilePicker.tsx
/**
 * DriveFilePicker
 *
 * Opens the native file picker, which on iOS and Android includes
 * Google Drive as a source. Returns Drive file metadata to the parent.
 *
 * On web, falls back to a standard file input — Drive Picker API
 * integration for web would require a separate implementation using
 * the Google Picker API JS library loaded via script tag.
 */

import * as DocumentPicker from "expo-document-picker";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export interface DriveFile {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
}

interface Props {
  onFilePicked: (file: DriveFile) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function DriveFilePicker({ onFilePicked, onError, disabled }: Props) {
  const [loading, setLoading] = React.useState(false);

  const handlePick = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: false,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      if (!asset) return;

      onFilePicked({
        fileId: extractDriveFileId(asset.uri),
        name: asset.name,
        mimeType: asset.mimeType || "application/octet-stream",
        webViewLink: asset.uri,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to pick file";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={handlePick}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.label}>Add from Google Drive</Text>
      )}
    </TouchableOpacity>
  );
}

/**
 * Extract the Drive file ID from a Drive URI.
 * Drive file URIs contain the file ID as a 25+ character alphanumeric segment.
 *
 * @see https://developers.google.com/workspace/drive/api/reference/rest/v3/files
 */
function extractDriveFileId(uri: string): string {
  const match = uri.match(/[-\w]{25,}/);
  return match ? match[0] : uri;
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 180,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

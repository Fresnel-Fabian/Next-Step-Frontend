// services/googleDriveService.ts
/**
 * Google Drive Service
 *
 * Handles all Drive API calls:
 *  - List files (All / Shared with me / Recent)
 *  - Download a file to device cache
 *  - Open a file preview in the browser
 *  - Upload a file and optionally open the Drive sharing UI
 *
 * All calls use the OAuth access token stored in authStore.
 * Token is obtained during Google sign-in and saved to AsyncStorage.
 */

import { DocumentItem } from "@/types/document";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as WebBrowser from "expo-web-browser";

// ─── Storage key (must match authStore) ──────────────────────────────────────
export const GOOGLE_ACCESS_TOKEN_KEY = "google_access_token";

// ─── Drive API base ───────────────────────────────────────────────────────────
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";

// ─── Drive file fields we request ────────────────────────────────────────────
const FILE_FIELDS =
  "id,name,mimeType,size,modifiedTime,viewedByMeTime,webViewLink,webContentLink,owners,shared,sharedWithMeTime";

// ─── MIME → display type ──────────────────────────────────────────────────────
const mimeToType = (mime: string): DocumentItem["type"] => {
  if (mime === "application/pdf") return "PDF";
  if (
    mime === "application/msword" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.google-apps.document"
  )
    return "DOC";
  if (
    mime === "application/vnd.ms-excel" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.google-apps.spreadsheet"
  )
    return "XLS";
  return "FILE";
};

// ─── Format helpers ───────────────────────────────────────────────────────────
const formatSize = (bytes?: string | number): string => {
  const n = Number(bytes);
  if (!n) return "Unknown size";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return "Unknown date";
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

type DriveDocumentItem = DocumentItem & {
  _modifiedTime?: string;
  _viewedByMeTime?: string;
  _sharedWithMeTime?: string;
};

// ─── Map raw Drive file → DocumentItem ───────────────────────────────────────
const mapDriveFile = (file: any): DriveDocumentItem => ({
  id: file.id,
  title: file.name,
  category: file.shared ? "Shared" : "My Drive",
  description: undefined,
  type: mimeToType(file.mimeType),
  size: formatSize(file.size),
  author: file.owners?.[0]?.displayName ?? "Unknown",
  date: formatDate(file.modifiedTime),
  access: file.shared ? "All Staff" : "Only me",
  url: file.webContentLink ?? file.webViewLink ?? "",
  _modifiedTime: file.modifiedTime,
  _viewedByMeTime: file.viewedByMeTime ?? file.modifiedTime,
  _sharedWithMeTime: file.sharedWithMeTime,
});

// ─── Sort helpers ─────────────────────────────────────────────────────────────
export type SortOption =
  | "viewedByMe_desc"
  | "viewedByMe_asc"
  | "modified_desc"
  | "modified_asc";

export const SORT_LABELS: Record<SortOption, string> = {
  viewedByMe_desc: "Last accessed (newest)",
  viewedByMe_asc: "Last accessed (oldest)",
  modified_desc: "Date modified (newest)",
  modified_asc: "Date modified (oldest)",
};

export const sortDocuments = (
  docs: DocumentItem[],
  sort: SortOption,
): DocumentItem[] => {
  return [...docs].sort((a: any, b: any) => {
    const aTime = sort.startsWith("viewedByMe")
      ? (a._viewedByMeTime ?? a._modifiedTime)
      : a._modifiedTime;
    const bTime = sort.startsWith("viewedByMe")
      ? (b._viewedByMeTime ?? b._modifiedTime)
      : b._modifiedTime;
    const diff = new Date(aTime).getTime() - new Date(bTime).getTime();
    return sort.endsWith("desc") ? -diff : diff;
  });
};

// ─── Core API call ────────────────────────────────────────────────────────────
async function driveGet(
  path: string,
  params: Record<string, string> = {},
): Promise<any> {
  const token = await AsyncStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
  if (!token)
    throw new Error("Not authenticated with Google. Please sign in again.");

  const url = new URL(`${DRIVE_API}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401)
    throw new Error("Google session expired. Please sign in again.");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `Drive API error ${res.status}`);
  }
  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * List all Drive files the user can access (My Drive + Shared with me).
 */
export async function listAllFiles(): Promise<DocumentItem[]> {
  const data = await driveGet("/files", {
    fields: `files(${FILE_FIELDS})`,
    pageSize: "100",
    orderBy: "viewedByMeTime desc",
  });
  return (data.files ?? []).map(mapDriveFile);
}

/**
 * List only files that have been shared with the signed-in user.
 */
export async function listSharedWithMe(): Promise<DocumentItem[]> {
  const data = await driveGet("/files", {
    q: "sharedWithMe=true",
    fields: `files(${FILE_FIELDS})`,
    pageSize: "100",
    orderBy: "sharedWithMeTime desc",
  });
  return (data.files ?? []).map(mapDriveFile);
}

/**
 * List recently viewed files.
 */
export async function listRecentFiles(): Promise<DocumentItem[]> {
  const data = await driveGet("/files", {
    fields: `files(${FILE_FIELDS})`,
    pageSize: "20",
    orderBy: "viewedByMeTime desc",
  });
  return (data.files ?? []).map(mapDriveFile);
}

/**
 * Search files by name keyword.
 */
export async function searchFiles(query: string): Promise<DocumentItem[]> {
  const data = await driveGet("/files", {
    q: `name contains '${query.replace(/'/g, "\\'")}' and trashed=false`,
    fields: `files(${FILE_FIELDS})`,
    pageSize: "50",
  });
  return (data.files ?? []).map(mapDriveFile);
}

/**
 * Open the file in the system browser for preview.
 * For Google Docs/Sheets/Slides this shows the native Google editor.
 * For PDF/DOCX/etc. it uses the Drive viewer.
 */
export async function previewFile(item: DocumentItem): Promise<void> {
  const viewUrl = `https://drive.google.com/file/d/${item.id}/view`;
  await WebBrowser.openBrowserAsync(viewUrl, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

/**
 * Download a file to the device cache directory, then open the system share sheet.
 * Works for binary files (PDF, DOCX, XLSX, images).
 * Google native formats (Docs/Sheets) are exported as PDF first.
 */
export async function downloadFile(item: DocumentItem): Promise<void> {
  const token = await AsyncStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
  if (!token) throw new Error("Not authenticated with Google.");

  // Google-native formats need export, others use direct download
  const isGoogleNative = !item.url || !item.url.includes("webContentLink");
  const downloadUrl = isGoogleNative
    ? `${DRIVE_API}/files/${item.id}/export?mimeType=application/pdf`
    : `${DRIVE_API}/files/${item.id}?alt=media`;

  const localPath = `${FileSystem.cacheDirectory}${item.title.replace(/[^a-zA-Z0-9._-]/g, "_")}.${
    isGoogleNative ? "pdf" : item.type.toLowerCase()
  }`;

  const downloadResult = await FileSystem.downloadAsync(
    downloadUrl,
    localPath,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (downloadResult.status !== 200) {
    throw new Error("Download failed. The file may not be accessible.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(downloadResult.uri, {
      mimeType: isGoogleNative ? "application/pdf" : undefined,
    });
  } else {
    throw new Error("Sharing is not available on this device.");
  }
}

/**
 * Open the Drive sharing dialog so the user can change permissions on a file they own.
 * This opens the Drive web UI — there is no in-app sharing dialog in the Drive API.
 */
export async function openSharingSettings(item: DocumentItem): Promise<void> {
  const url = `https://drive.google.com/file/d/${item.id}/edit?usp=sharing`;
  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}

/**
 * Upload a file to Google Drive (admin use).
 * After upload, opens the Drive sharing dialog so the admin can share it.
 *
 * @param name     Display name for the file
 * @param uri      Local file URI (from expo-document-picker)
 * @param mimeType MIME type of the file
 */
export async function uploadFile(
  name: string,
  uri: string,
  mimeType: string,
): Promise<DocumentItem> {
  const token = await AsyncStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
  if (!token) throw new Error("Not authenticated with Google.");

  // Read the file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Multipart upload: metadata + ddfile content
  const boundary = "next_step_upload_boundary";
  const metadata = JSON.stringify({ name, mimeType });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=${FILE_FIELDS}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Upload failed");
  }

  const file = await res.json();
  return mapDriveFile(file);
}

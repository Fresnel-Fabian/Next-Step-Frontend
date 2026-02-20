export type DocumentCategory =
  | "all"
  | "policies"
  | "forms"
  | "handbooks"
  | "resources";

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  type: "PDF" | "DOC" | "XLS" | "FILE";
  size: string;
  author: string;
  date: string;
  access: string;
  url?: string;
}

export interface CreateDocumentData {
  title: string;
  category: DocumentCategory;
  description?: string;
  fileUrl: string;
  fileSize: number;
}

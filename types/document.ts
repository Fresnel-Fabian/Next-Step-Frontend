export type DocumentCategory = "all" | "recent" | "shared with me";

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  description?: string;
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

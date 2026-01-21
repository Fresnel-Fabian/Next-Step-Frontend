export type DocumentCategory = 'all' | 'policies' | 'forms' | 'handbooks' | 'resources';

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  type: 'PDF' | 'DOC' | 'XLS';
  size: string;
  author: string;
  date: string;
  access: string;
  url?: string;
}
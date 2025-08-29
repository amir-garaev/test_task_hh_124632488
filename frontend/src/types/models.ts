export type JwtToken = string;

export interface Resume {
  id: number;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface ResumeCreate {
  title: string;
  content: string;
}

export interface ResumeUpdate {
  title?: string;
  content?: string;
}

export interface TokenResponse {
  access_token: JwtToken;
  token_type?: "bearer";
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
export interface ResumeRevision {
  id: number;
  resume_id: number;
  version: number;
  content: string;
  comment?: string | null;
  created_at: string; 
}
export interface ResumePage {
  items: Resume[];
  meta: PageMeta;
}
export interface ResumeRevisionPage {
  items: ResumeRevision[];
  meta: PageMeta;
}
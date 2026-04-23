export interface PageContent {
  index: number;
  title: string;
  body: string;
}

export interface GenerationResult {
  pages: PageContent[];
}
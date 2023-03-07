import faqItems from "./data.json";

// TODO: make nested structure
export interface FaqItem {
  id: number;
  category: string;
  section: string;
  subject: string | null;
  question: string;
  answer: string;
}

export async function getListOfFaqItems(): Promise<FaqItem[]> {
  return faqItems;
}

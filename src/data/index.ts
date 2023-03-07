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

export interface Category {
  name: string;
  sections: Section[];
}

export type Section = {
  name: string;
} & (
  | {
      subjects: Subject[];
    }
  | {
      questions: Question[];
    }
);

export interface Subject {
  name: string;
  questions: Question[];
}

export interface Question {
  id: number;
  question: string;
  answer: string;
}

export async function getListOfFaqItems(): Promise<FaqItem[]> {
  return faqItems;
}

export async function getFaqItemTree(): Promise<Category[]> {
  let result = new Map<string, Category>();
  for (const faqItem of faqItems) {
    let category = result.get(faqItem.category);
    if (category) {
      appendItemToCategory(category, faqItem);
    } else {
      category = { name: faqItem.category, sections: [getSection(faqItem)] };
    }
    result.set(faqItem.category, category);
  }

  return [...result.values()];
}

function appendItemToCategory(category: Category, faqItem: FaqItem) {
  const section = category.sections.find(
    (section) => section.name === faqItem.section
  );
  if (!section) {
    const newSection = getSection(faqItem);
    category.sections.push(newSection);
  } else {
    appendItemToSection(faqItem, section);
  }
}

function getSection(faqItem: FaqItem): Section {
  if (faqItem.subject) {
    return getSectionWithSubjects(faqItem);
  } else {
    return getSectionWithQuestions(faqItem);
  }
}

function getSectionWithSubjects(faqItem: FaqItem): Section {
  return {
    name: faqItem.section,
    subjects: [getSubjectForItem(faqItem)],
  };
}

function getSectionWithQuestions(faqItem: FaqItem): Section {
  return {
    name: faqItem.section,
    questions: [getQuestionForItem(faqItem)],
  };
}

function appendItemToSection(faqItem: FaqItem, section: Section) {
  if (faqItem.subject && "subjects" in section) {
    appendItemToSubject(section, faqItem);
  } else if ("questions" in section) {
    section.questions.push(getQuestionForItem(faqItem));
  } else {
    throw new Error(
      `Invalid combination of question / subjects in section ${section.name}`
    );
  }
}

function appendItemToSubject(
  section: { name: string } & { subjects: Subject[] },
  faqItem: FaqItem
) {
  let subject = section.subjects.find(
    (subject) => subject.name === faqItem.subject
  );
  if (subject) {
    subject.questions.push(getQuestionForItem(faqItem));
  } else {
    section.subjects.push(getSubjectForItem(faqItem));
  }
}

function getSubjectForItem(faqItem: FaqItem): Subject {
  return {
    name: faqItem.subject!,
    questions: [getQuestionForItem(faqItem)],
  };
}

function getQuestionForItem(faqItem: FaqItem): Question {
  return {
    id: faqItem.id,
    question: faqItem.question,
    answer: faqItem.answer,
  };
}

/** The fields an editor supplies when creating or changing a FAQ entry. */
export type FaqInput = {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

/** An active entry as the public accordion consumes it. */
export type Faq = {
  id: string;
  question: string;
  answer: string;
};

/** An entry as the admin editor consumes it, including the unpublished fields. */
export type AdminFaq = Faq & {
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

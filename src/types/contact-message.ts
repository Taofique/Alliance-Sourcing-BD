/**
 * A message sent through the form at the bottom of /contact.
 *
 * Messages are append-only: a visitor cannot edit what they sent, so the record
 * is only ever created, marked read, or deleted.
 */
export type ContactMessageInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

/**
 * A hidden field a human never sees. Bots that fill in every input on the page
 * trip it, and the submission is dropped while the visitor still sees a success
 * message — telling a spammer their address did not work is not worth the
 * effort.
 */
export type ContactMessagePayload = ContactMessageInput & {
  website: string;
};

export type ContactMessage = ContactMessageInput & {
  id: string;
  isRead: boolean;
  createdAt: string;
};

export type AdminContactMessage = ContactMessage & {
  updatedAt: string;
};

export const CONTACT_MESSAGE_ID_PATTERN = /^[a-f\d]{24}$/i;

import { Schema } from 'mongoose';

export interface ITranslation {
  en: string;
  fr: string;
  de: string;
  it: string;
}

const translationSchema = new Schema<ITranslation>(
  {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    de: { type: String, required: true },
    it: { type: String, required: true },
  },
  { _id: false },
);

export { translationSchema };

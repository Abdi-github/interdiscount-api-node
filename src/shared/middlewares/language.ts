import { Request, Response, NextFunction } from 'express';

const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'it'] as const;
const DEFAULT_LANGUAGE = 'de';

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const languageMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const acceptLanguage = req.headers['accept-language'];

  if (acceptLanguage) {
    // Parse first language from header (e.g., "de-CH,de;q=0.9,en;q=0.8")
    const primary = acceptLanguage.split(',')[0].split('-')[0].toLowerCase().trim();

    if (SUPPORTED_LANGUAGES.includes(primary as SupportedLanguage)) {
      req.language = primary;
    } else {
      req.language = DEFAULT_LANGUAGE;
    }
  } else {
    req.language = DEFAULT_LANGUAGE;
  }

  next();
};

export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, SupportedLanguage };
export default languageMiddleware;

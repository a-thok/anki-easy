import type { Handler } from 'vite-plugin-mix';
import crypto from 'node:crypto';

type TranslationResult = {
  message: {
    baesInfo: {
      word_name: string;
      symbols: Array<{
        ph_en: string;
        ph_en_mp3: string;
        parts: Array<{ means: string[] }>;
      }>;
    };
    new_sentence?: Array<{
      tag: string;
      word: string;
      meaning: string;
      sentences: Array<{ en: string }>;
    }>;
    bidec: {
      parts: Array<{
        means: Array<{
          word_mean: string;
          sentences: Array<{ en: string }>
        }>
      }>
    };
  };
  status: 0 | 1;
};

export type Card = {
  id: number;
  front: string;
  back: string;
}

async function getIcibaTranslation(word: string) {
  const API_PATH = '/dictionary/word/query/web';
  const SIG_KEY = '7ece94d9f9c202b0d2ec557dg4r9bc';
  const timestamp = Date.now();
  const content = `${API_PATH}61000006${timestamp}${word.toLowerCase()}${SIG_KEY}`;
  const signature = crypto.createHash('md5').update(content).digest('hex');

  const query = [
    'client=6',
    'key=1000006',
    `timestamp=${timestamp}`,
    `word=${word}`,
    `signature=${signature}`,
  ].join('&');
  const res = await fetch(`https://dict.iciba.com${API_PATH}?${query}`);
  const data = await res.json() as TranslationResult;
  return data;
}

// eslint-disable-next-line import/prefer-default-export
export const handler: Handler = (req, res, next) => {
  if (req.path.startsWith('/translate/')) {
    const word = decodeURIComponent(req.path.split('/').at(-1)!);
    getIcibaTranslation(word)
      .then((data) => {
        const { message: { baesInfo, new_sentence: newSentence, bidec } } = data;

        let front = baesInfo.word_name;
        const back: string[] = [];

        if (baesInfo.symbols[0]) {
          front += ` [${baesInfo.symbols[0].ph_en}]`;
        }

        const hasMultipleSections = newSentence && newSentence.length > 1;
        const hasSingleSentenceAndNoBidec = newSentence && newSentence.length === 1 && !bidec;

        if (hasMultipleSections || hasSingleSentenceAndNoBidec) {
          const sections = hasMultipleSections ? newSentence.slice(1) : newSentence;

          sections.forEach(({ meaning, sentences }) => {
            front += '<br><br>';
            front += sentences.slice(0, 2).map((sentence) => sentence.en).join('<br>');
            if (hasMultipleSections) {
              back.push(meaning);
            }
          });
        } else if (bidec) {
          bidec.parts
            .flatMap(({ means }) => means)
            .forEach(({ word_mean: wordMean, sentences }) => {
              if (sentences.length) {
                front += '<br><br>';
                front += sentences.map((sentence) => sentence.en).join('<br>');
              }
              back.push(wordMean);
            });
        }

        if (hasSingleSentenceAndNoBidec || !bidec) {
          const meanings = baesInfo.symbols
            .flatMap(({ parts }) => parts)
            .flatMap((part) => part.means);
          back.push(...meanings);
        }

        res.setHeader('Content-Type', 'application/json');
        const json: Card = {
          id: Math.random(),
          front,
          back: back.join('；'),
        };
        res.end(JSON.stringify(json));
      })
      .catch((error) => {
        console.log(error); // eslint-disable-line
      });
  } else {
    next();
  }
};

type AnkiResponse = {
  result: any;
  error: null;
} | {
  result: null;
  error: string;
};

interface Note {
  deckName: string;
  modelName: string;
  fields: {
    Front: string;
    Back: string;
  };
}

type AnkiResults = {
  deckNames: {
    params: undefined;
    result: string[];
  };
  deckNamesAndIds:{
    params: undefined;
    result: Record<string, number>;
  };
  findCards: {
    params: {
      query: `deck:${string}`;
    };
    result: number[];
  };
  cardsInfo: {
    params: {
      cards: number[];
    };
    result: any;
  };
  addNote: {
    params: {
      note: Note;
    };
    result: number | null;
  };
  addNotes: {
    params: {
      notes: Note[];
    };
    result: Array<number | null>;
  };
};

type AnkiAction = keyof AnkiResults;

class Anki {
  #endpoint = '/anki';

  #version = 6;

  // eslint-disable-next-line max-len
  async action<T extends AnkiAction>(actionName: T, params?: AnkiResults[T]['params']): Promise<AnkiResults[T]['result']> {
    const res = await fetch(this.#endpoint, {
      method: 'POST',
      body: JSON.stringify({
        action: actionName,
        version: this.#version,
        params,
      }),
    });

    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }

    const json = await res.json() as AnkiResponse;
    if (json.error != null) {
      throw new Error(json.error);
    }

    return json.result;
  }
}

export default new Anki();

import {
  type FormEventHandler,
  type ChangeEventHandler,
  useEffect,
  useReducer,
  useRef,
  Reducer,
} from 'react';

import { type Card } from './utils/translate';
import anki from './utils/anki';
import ThemeToggle from './components/theme-toggle';

interface State {
  isLoading: boolean,
  decks: string[],
  selectedDeck: string;
  cards: Card[];
}

type Action ={
  type: 'updateLoading',
  payload: boolean;
} | {
  type: 'updateDecks',
  payload: string[];
} | {
  type: 'selectDeck',
  payload: string;
} | {
  type: 'updateCards';
  payload: Card[];
} | {
  type: 'removeCard';
  payload: number;
};

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'updateLoading':
      return { ...state, isLoading: action.payload };
    case 'updateDecks':
      return { ...state, decks: action.payload };
    case 'selectDeck':
      return { ...state, selectedDeck: action.payload };
    case 'updateCards':
      return { ...state, cards: action.payload };
    case 'removeCard':
      return {
        ...state,
        cards: state.cards.filter((card) => card.id !== action.payload),
      };
    default:
      throw new Error('invalid action');
  }
};

const initailState: State = {
  isLoading: false,
  decks: [],
  selectedDeck: '',
  cards: [],
};

function App() {
  const [state, dispatch] = useReducer(reducer, initailState);

  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    (async () => {
      const decks = await anki.action('deckNames');
      dispatch({
        type: 'updateDecks',
        payload: decks,
      });
    })();
  }, []);

  const onMakeCards: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (event.currentTarget.content instanceof HTMLTextAreaElement) {
      const { value } = event.currentTarget.content;
      const words = value.split(/,|\n/).filter((w) => w);

      dispatch({
        type: 'updateLoading',
        payload: true,
      });
      const cards = await Promise.all(
        words.map((word) => fetch(`/translate/${word}`).then((res) => res.json())),
      );
      dispatch({
        type: 'updateLoading',
        payload: false,
      });
      dispatch({
        type: 'updateCards',
        payload: cards,
      });
    }
  };

  const onSelectDeck: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const { value } = event.currentTarget;
    dispatch({
      type: 'selectDeck',
      payload: value,
    });
  };

  const onRemoveCard = (card: Card) => {
    dispatch({
      type: 'removeCard',
      payload: card.id,
    });
  };

  // todo 选择卡片组
  const onAddCard = async (card: Card) => {
    if (!state.selectedDeck) {
      dialogRef.current?.showModal();
      return;
    }

    await anki.action('addNote', {
      note: {
        deckName: 'Default',
        modelName: 'Basic',
        fields: {
          Front: card.front,
          Back: card.back,
        },
      },
    });
  };

  const onAddAllCards = async () => {
    if (!state.selectedDeck) {
      dialogRef.current?.showModal();
      return;
    }

    await anki.action('addNotes', {
      notes: state.cards.map((card: Card) => ({
        deckName: 'Default',
        modelName: 'Basic',
        fields: {
          Front: card.front,
          Back: card.back,
        },
      })),
    });
  };

  /* eslint-disable react/no-danger */
  return (
    <div className="max-w-7xl mx-auto w-11/12 py-4">
      <div className="flex items-center mb-6">
        <ThemeToggle />

        {state.decks.length ? (
          <select
            className="w-full sm:w-72 px-2 py-2 rounded-md"
            value={state.selectedDeck}
            onChange={onSelectDeck}
          >
            <option value="" disabled>选择要添加卡片的牌组</option>
            {state.decks.map((deck) => (
              <option key={deck} value={deck}>{deck}</option>
            ))}
          </select>
        ) : '正在加载牌组...'}
      </div>

      <form className="mb-8" onSubmit={onMakeCards}>
        <textarea
          name="content"
          className="w-full p-2 rounded-m border border-neutral-200 rounded-md dark:border-0"
          placeholder="输入要制作卡片的单词，多个单词以半角逗号或换行隔开"
        />
        <button
          type="submit"
          className="w-full py-2 rounded-md mt-2 bg-sky-400 disabled:bg-sky-300 text-white"
          disabled={state.isLoading}
        >
          制作卡片
        </button>
      </form>

      {state.cards.length ? (
        <>
          <ul className="list-none grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {state.cards.map((card) => (
              <li
                key={card.id}
                className="
                  flex flex-col relative px-3 rounded-md border border-neutral-100 bg-white shadow-md
                  dark:bg-zinc-900 dark:border-neutral-600
                "
              >
                <div
                  className="pt-3 pb-4"
                  style={{ fontFamily: 'Inter, Avenir, Helvetica, Arial, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: card.front }}
                />
                <div
                  className="h-20 pt-4 pb-3 border-t border-neutral-100 dark:border-neutral-700 mt-auto"
                  dangerouslySetInnerHTML={{ __html: card.back }}
                />
                <div className="absolute top-3 right-3 flex gap-5">
                  <button
                    className="text-red-500"
                    type="button"
                    onClick={async () => onRemoveCard(card)}
                  >
                    移除
                  </button>
                  <button
                    type="button"
                    className="text-green-500 dark:text-lime-500"
                    onClick={async () => onAddCard(card)}
                  >
                    添加到Anki
                  </button>
                </div>

              </li>
            ))}
          </ul>

          <button
            type="button"
            className="w-full py-4 rounded-md mt-4 bg-green-500 text-white dark:bg-lime-500"
            onClick={onAddAllCards}
          >
            添加全部卡片到Anki
          </button>
        </>
      ) : undefined}

      { state.isLoading ? (
        <div className="text-center">
          卡片加载中...
        </div>
      ) : undefined}

      <dialog
        ref={dialogRef}
        className="border-neutral-200 rounded-lg shadow-md dark:border-4"
      >
        <p className="text-orange-400">在页面上方选择目标牌组后，才可添加卡片</p>
        <form
          method="dialog"
          className="flex justify-end mt-8"
        >
          <button type="submit">关闭提示</button>
        </form>
      </dialog>
    </div>
  );
}

export default App;

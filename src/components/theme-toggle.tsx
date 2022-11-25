import { useEffect, useState, type ChangeEventHandler } from 'react';

function handleThemeClass(isDark: boolean) {
  const action = isDark ? 'add' : 'remove';
  document.documentElement.classList[action]('dark');
  document.body.classList[action]('dark');
}

const STORAGE_KEY = 'USER_PREFER_DARK';

function ThemeToggle() {
  const [isDark, updateMode] = useState(false);

  useEffect(() => {
    const userPreferDark = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'false');
    const browserMatchDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const useDark = userPreferDark || browserMatchDark;
    updateMode(useDark);
    handleThemeClass(useDark);
  }, []);

  const onChangeMode: ChangeEventHandler<HTMLInputElement> = (event) => {
    const { checked } = event.target;
    updateMode(checked);
    handleThemeClass(checked);
    localStorage.setItem(STORAGE_KEY, String(checked));
  };

  return (
    <label
      className="flex items-center pr-4 mr-auto"
      htmlFor="theme-toggle"
      title="切换浅色与深色模式"
    >
      <input
        className="peer sr-only"
        type="checkbox"
        name="theme-toggle"
        id="theme-toggle"
        checked={isDark}
        onChange={onChangeMode}
      />
      <div
        className="
              flex items-center w-10 h-6 px-1 border border-orange-400 rounded-full bg-white after:content-['']
              after:block after:rounded-full after:w-4 after:h-4 after:bg-orange-600
              peer-checked:bg-zinc-900 peer-checked:justify-end peer-checked:border-yellow-100 peer-checked:after:bg-yellow-300
              cursor-pointer transition duration-300
            "
      />
      <span className="ml-2 text-sm whitespace-nowrap">{ isDark ? '深色' : '浅色' }</span>
    </label>
  );
}

export default ThemeToggle;

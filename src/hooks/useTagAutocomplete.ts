import { useState, useEffect, useRef } from 'react';
import { BooruEngine, BooruTagItem } from '../types/booru';
import { booruApiService } from '../services/api';

export function useTagAutocomplete(inputValue: string, engine: BooruEngine) {
  const [suggestions, setSuggestions] = useState<BooruTagItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const timeoutRef = useRef<any>(null);

  useEffect(() => {
    // Extract last active word user is typing
    const words = inputValue.split(/\s+/);
    const lastWord = words[words.length - 1] || '';

    // Ignore tag prefix like rating: or -
    const cleanWord = lastWord.replace(/^[-+]/, '');

    if (cleanWord.length < 2 || cleanWord.includes(':')) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setCurrentWord(cleanWord);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const results = await booruApiService.searchTags(cleanWord, engine);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 200);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inputValue, engine]);

  const closeSuggestions = () => setIsOpen(false);

  return {
    suggestions,
    isOpen,
    currentWord,
    closeSuggestions,
  };
}

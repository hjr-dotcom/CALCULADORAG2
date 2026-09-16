'use client';
import { useState, useEffect } from 'react';
import { defaultPrices } from '@/lib/defaultPrices';

export function usePrices() {
  const [prices, setPrices] = useState(defaultPrices);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('@calcGesso:prices');
    if (saved) {
      setPrices(JSON.parse(saved));
    }
    setIsLoaded(true);
  }, []);

  const updateMaterial = (materialKey: string, newName: string, newPix: number, newCred: number) => {
    const updated = {
      ...prices,
      [materialKey]: { nome: newName, pix: newPix, cred: newCred }
    };
    setPrices(updated);
    localStorage.setItem('@calcGesso:prices', JSON.stringify(updated));
  };

  return { prices, updateMaterial, isLoaded };
}
"use client";

import { SessionProvider } from "next-auth/react";
import React, { createContext, useContext, useState, useEffect } from "react";
import { INDIAN_CITIES } from "@/lib/constants";

interface CityContextType {
  selectedCity: string;
  setSelectedCity: (slug: string) => void;
  cityName: string;
}

const CityContext = createContext<CityContextType>({
  selectedCity: "mumbai",
  setSelectedCity: () => {},
  cityName: "Mumbai",
});

export const useCity = () => useContext(CityContext);

export function Providers({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCityState] = useState<string>("mumbai");

  useEffect(() => {
    const saved = localStorage.getItem("cinehub_city");
    if (saved) {
      setSelectedCityState(saved);
    }
  }, []);

  const setSelectedCity = (slug: string) => {
    setSelectedCityState(slug);
    localStorage.setItem("cinehub_city", slug);
  };

  const currentCityObj = INDIAN_CITIES.find((c) => c.slug === selectedCity) || INDIAN_CITIES[0];

  return (
    <SessionProvider>
      <CityContext.Provider
        value={{
          selectedCity,
          setSelectedCity,
          cityName: currentCityObj.name,
        }}
      >
        {children}
      </CityContext.Provider>
    </SessionProvider>
  );
}


// src/lib/greeting.ts

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
};

export const getUserName = (): string => {
  return "Eduardo";
};

// ✅ Retorna separado: texto e emoji
export const getFullGreetingParts = () => {
  return {
    text: `${getTimeBasedGreeting()}, ${getUserName()}`,
    emoji: "👋",
  };
};

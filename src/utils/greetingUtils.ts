export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return 'Bom dia';
  } else if (hour >= 12 && hour < 18) {
    return 'Boa tarde';
  } else {
    return 'Boa noite';
  }
};

export const getUserName = (): string => {
  return 'Eduardo';
};

export const getFullGreeting = (): string => {
  return `${getTimeBasedGreeting()}, ${getUserName()} 👋`;
};

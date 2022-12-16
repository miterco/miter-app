export const getAnimValues = (animateIn: boolean | undefined) => {
  const animInitial: Record<string, any> = {opacity: 0};
  const animAnimate: Record<string, any> = {
    opacity: 1,
    transition: {duration: 0.4},
  };
  if (animateIn) {
    animInitial.height = 0;
    animAnimate.height = 'auto';
  }

  return {animInitial, animAnimate};
};

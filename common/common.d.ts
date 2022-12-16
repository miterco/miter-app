declare global {
  const console: {
    log: (...params: any) => void;
    warn: (...params: any) => void;
    error: (...params: any) => void;
  };
}

export {};

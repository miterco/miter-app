const bridge = {

  sendMessage: (type: string, payload: Record<string, any>) => {
    window.parent.postMessage({miter:true, type, payload}, "https://calendar.google.com");
  }
};

export default bridge;


let globalRouter = null;

export const setGlobalRouter = (router) => {  // Export for use in other modules
  globalRouter = router;
};

export default {  // Export for use in other modules
  navigate: (path, options) => {
    if (globalRouter) {
      globalRouter(path, options);
    } else {
      console.warn('Router not initialized yet');
  // Fallback for early navigation attempts
      window.location.href = path;
    }
  }
};


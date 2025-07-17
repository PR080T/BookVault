
let globalRouter = null;

export const setGlobalRouter = (router) => {
  globalRouter = router;
};

export default {
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


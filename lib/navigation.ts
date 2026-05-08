type RouterLike = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: never) => void;
};

export function goBackOrReplace(router: RouterLike, fallback = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback as never);
}

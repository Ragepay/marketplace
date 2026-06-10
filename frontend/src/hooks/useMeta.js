import { useEffect } from "react";

const setTag = (attr, key, content) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * Actualiza title + meta tags (incluye Open Graph) para SEO/compartir.
 * Útil en una SPA para que cada vista tenga su propio título y preview.
 */
export const useMeta = ({ title, description, image }) => {
  useEffect(() => {
    const prev = document.title;
    if (title) document.title = `${title} · PopMart`;
    setTag("name", "description", description);
    setTag("property", "og:title", title);
    setTag("property", "og:description", description);
    setTag("property", "og:image", image);
    setTag("property", "og:type", "website");
    return () => {
      document.title = prev;
    };
  }, [title, description, image]);
};

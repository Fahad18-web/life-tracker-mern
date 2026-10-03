import { useEffect } from 'react';

/**
 * Inject JSON-LD for SEO + generative engines (ChatGPT, Perplexity, AI Overviews).
 */
export default function JsonLd({ data, id = 'json-ld' }) {
  useEffect(() => {
    if (!data) return;

    const scriptId = id;
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [data, id]);

  return null;
}
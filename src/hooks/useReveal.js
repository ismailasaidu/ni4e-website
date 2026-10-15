import { useEffect } from 'react';

export default function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.reveal:not([data-reveal-ready])'));
    if (!nodes.length) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      nodes.forEach(node => { node.classList.add('is-visible'); node.dataset.revealReady = 'true'; });
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          entry.target.dataset.revealReady = 'true';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

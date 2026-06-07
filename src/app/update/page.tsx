'use client';

import React, {useEffect, useRef, useState} from 'react';


export default function UpdatePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let addedNodes: Node[] = [];
    let isUnmounted = false;

    async function loadAndInject() {
      try {
        const res = await fetch('/update.html');
        const text = await res.text();
        // parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');

        if (isUnmounted) return;

        // inject styles from the fetched doc head
        const styles = Array.from(doc.querySelectorAll('style'));
        styles.forEach(style => {
          const s = document.createElement('style');
          s.textContent = style.textContent;
          document.head.appendChild(s);
          addedNodes.push(s);
        });

        // inject link[rel=stylesheet] if any
        const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
        links.forEach(link => {
          const l = document.createElement('link');
          l.rel = 'stylesheet';
          if (link.href) l.href = link.href;
          if (link.media) l.media = link.media;
          document.head.appendChild(l);
          addedNodes.push(l);
        });

        // set body html
        if (containerRef.current) {
          containerRef.current.innerHTML = doc.body.innerHTML || '';
        }

        // inject scripts (preserve execution order)
        const scripts = Array.from(doc.querySelectorAll('script')) as HTMLScriptElement[];
        for (const script of scripts) {
          const s = document.createElement('script');
          if (script.src) {
            s.src = script.src;
            s.async = false;
            // copy type if present
            if (script.type) s.type = script.type;
            document.body.appendChild(s);
            addedNodes.push(s);
            // wait for external script to load before continuing
            await new Promise<void>((resolve, reject) => {
              s.onload = () => resolve();
              s.onerror = () => resolve();
            });
          } else {
            s.textContent = script.textContent || '';
            document.body.appendChild(s);
            addedNodes.push(s);
          }
        }

        if (!isUnmounted) setLoaded(true);
      } catch (err) {
        console.error('Failed to load update.html', err);
      }
    }

    loadAndInject();

    return () => {
      isUnmounted = true;
      // cleanup added nodes
      addedNodes.forEach(n => n.parentNode && n.parentNode.removeChild(n));
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div style={{width: '100%', minHeight: '100vh'}}>
      <div ref={containerRef} />
      {!loaded && <div style={{position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading update page...</div>}
    </div>
  );
}

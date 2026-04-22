// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

/**
 * Sanitiza una cadena HTML eliminando scripts y atributos peligrosos.
 * Usar antes de renderizar contenido dinámico del backend.
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li',
      'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'blockquote', 'code', 'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'style'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Componente React helper para renderizar HTML seguro.
 *
 * Uso:
 * ```tsx
 * import { SafeHTML } from '@/lib/sanitize';
 * <SafeHTML html={backendContent} className="prose" />
 * ```
 */
export function SafeHTML({
  html,
  as: Tag = 'div',
  ...rest
}: {
  html: string;
  as?: keyof HTMLElementTagNameMap;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      {...rest}
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
    />
  );
}

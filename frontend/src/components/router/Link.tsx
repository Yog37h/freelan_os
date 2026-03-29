import * as React from 'react';
import { Link as RouterLink } from '@tanstack/react-router';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
  to?: string;
  params?: Record<string, string>;
};

function buildHref(to?: string, href?: string, params?: Record<string, string>) {
  const target = href || to || '#';
  if (!params) {
    return target;
  }

  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`$${key}`, value),
    target,
  );
}

export function Link({ href, to, params, children, ...props }: LinkProps) {
  const target = buildHref(to, href, params);

  if (/^(https?:|mailto:|tel:)/.test(target)) {
    return (
      <a href={target} {...props}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={target} preload="intent" {...props}>
      {children}
    </RouterLink>
  );
}

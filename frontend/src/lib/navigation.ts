import { useNavigate } from '@tanstack/react-router';

export function useAppNavigate() {
  const navigate = useNavigate();

  return {
    navigate: (target: string | { to: string; replace?: boolean }) => {
      if (typeof target === 'string') {
        return navigate({ to: target });
      }

      return navigate({ to: target.to, replace: target.replace });
    },
    replace: (href: string) => {
      return navigate({ to: href, replace: true });
    },
  };
}

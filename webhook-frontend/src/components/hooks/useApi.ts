import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from 'react-query';

export function useApi<T, R>(
  mutationFn: (data: T) => Promise<R>,
  options: {
    onSuccess?: (data: R) => void;
    invalidateQueries?: string[];
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation(mutationFn, {
    onSuccess: (data) => {
      options.onSuccess?.(data);
      options.invalidateQueries?.forEach(query => {
        queryClient.invalidateQueries(query);
      });
    },
    onError: (error: Error) => {
      notifications.show({
        title: 'Error',
        message: error.message,
        color: 'red'
      });
    }
  });
}
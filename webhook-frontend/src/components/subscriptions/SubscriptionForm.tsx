import { TextInput, Button, Stack, MultiSelect, Card, Title } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { subscriptionService } from '../../services/subscriptionService';

export function SubscriptionForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    target_url: '',
    secret_key: '',
    event_types: [] as string[]
  });

  const createSubscription = useApi(subscriptionService.create, {
    onSuccess: () => {
      navigate('/subscriptions');
    },
    invalidateQueries: ['subscriptions']
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createSubscription.mutate({
      target_url: form.target_url,
      secret_key: form.secret_key,
      event_types: form.event_types
    });
  };

  return (
    <Card>
      <Title order={2} mb="md">Create New Subscription</Title>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Target URL"
            placeholder="https://webhook.site/your-webhook-url"
            required
            value={form.target_url}
            onChange={(e) => setForm({...form, target_url: e.target.value})}
          />
          <TextInput
            label="Secret Key"
            placeholder="Your secret key"
            required
            value={form.secret_key}
            onChange={(e) => setForm({...form, secret_key: e.target.value})}
          />
          <MultiSelect
            label="Event Types"
            placeholder="Select event types"
            required
            data={[
              { value: 'order.created', label: 'Order Created' },
              { value: 'order.updated', label: 'Order Updated' },
              { value: 'order.deleted', label: 'Order Deleted' },
              { value: 'payment.succeeded', label: 'Payment Succeeded' },
              { value: 'payment.failed', label: 'Payment Failed' }
            ]}
            value={form.event_types}
            onChange={(value) => setForm({...form, event_types: value})}
          />
          <Button 
            type="submit" 
            loading={createSubscription.isLoading}
            disabled={!form.target_url || !form.secret_key || form.event_types.length === 0}
          >
            Create Subscription
          </Button>
        </Stack>
      </form>
    </Card>
  );
}
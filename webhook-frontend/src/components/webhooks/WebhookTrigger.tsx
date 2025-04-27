import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  CopyButton,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Code,
  Paper
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { HmacSHA256 } from 'crypto-js';
import { enc } from 'crypto-js';
import { Subscription } from '../../types/subscription';
import { subscriptionService } from '../../services/subscriptionService';

interface ISubscription extends Subscription {
  endpoint: string;
}

// The simplest and most reliable signature function
const generateDirectSignature = (payload: any, secretKey: string): string => {
  try {
    // Use exact same format as backend
    const simplePayloadStr = JSON.stringify(
      typeof payload === 'string' ? JSON.parse(payload) : payload, 
      null, 0  // no formatting, basic stringification
    );
    
    console.log('Raw payload as JSON:', simplePayloadStr);
    
    // Generate HMAC with SHA256 (matching backend)
    const hmac = HmacSHA256(simplePayloadStr, secretKey);
    const signature = hmac.toString(enc.Hex);
    
    console.log('Generated signature:', signature);
    return signature;
  } catch (error) {
    console.error('Failed to generate signature:', error);
    throw error;
  }
};

export function WebhookTrigger() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<ISubscription | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [form, setForm] = useState({
    event_type: '',
    payload: ''
  });
  const [curlCommand, setCurlCommand] = useState('');
  const [signature, setSignature] = useState('');

  // Fetch subscription details
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionService.getById(Number(id));
        setSubscription(data as ISubscription);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    };
    fetchSubscription();
  }, [id]);

  // Generate signature when payload or secret key changes
  useEffect(() => {
    if (!secretKey || !form.payload) return;
    
    try {
      const sig = generateDirectSignature(form.payload, secretKey);
      setSignature(sig);
    } catch (error) {
      console.error('Failed to generate signature:', error);
    }
  }, [secretKey, form.payload]);

  // Update cURL command whenever relevant data changes
  useEffect(() => {
    if (!form.payload || !form.event_type || !id) return;

    try {
      const payloadObj = JSON.parse(form.payload);
      const curl = `curl -X POST http://localhost:8000/webhooks/ingest/${id} \\
  -H "Content-Type: application/json" \\
  -H "X-Hub-Signature-256: sha256=${signature}" \\
  -d '${JSON.stringify({
    event_type: form.event_type,
    payload: payloadObj
  }, null, 2)}'`;

      setCurlCommand(curl);
    } catch (error) {
      console.error('Failed to generate cURL command:', error);
    }
  }, [id, form.event_type, form.payload, signature]);

  const executeCurl = async () => {
    setLoading(true);
    try {
      const payloadObj = JSON.parse(form.payload);
      const signature = generateDirectSignature(payloadObj, secretKey);

      const response = await fetch(`http://3.108.68.73:8000/webhooks/ingest/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': `sha256=${signature}`
        },
        body: JSON.stringify({
          payload: payloadObj,
          event_type: form.event_type
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to trigger webhook');
      }

      notifications.show({
        title: 'Success',
        message: 'Webhook triggered successfully',
        color: 'green'
      });
    } catch (error) {
      console.error('Failed to trigger webhook:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack
      gap="lg"
      style={{ width: '100%' }}
    >
      <Title order={2}>Trigger Webhook</Title>
      <Text>
        {subscription
          ? `Triggering webhook for ${subscription.endpoint}`
          : 'Loading subscription details...'}
      </Text>

      <Card withBorder>
        <Stack
          gap="md"
          style={{ width: '100%' }}
        >
          <TextInput
            label="Secret Key"
            description="Enter the secret key used for signing the payload"
            required
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />

          <Select
            label="Event Type"
            placeholder="Select event type"
            required
            data={[
              { value: 'order.created', label: 'Order Created' },
              { value: 'order.updated', label: 'Order Updated' },
              { value: 'order.deleted', label: 'Order Deleted' },
              { value: 'payment.succeeded', label: 'Payment Succeeded' },
              { value: 'payment.failed', label: 'Payment Failed' }
            ]}
            value={form.event_type}
            onChange={(value) => setForm({ ...form, event_type: value || '' })}
          />

          <Textarea
            label="Payload"
            placeholder="Enter your JSON payload"
            description="Enter valid JSON payload"
            required
            minRows={15}
            value={form.payload}
            onChange={(e) => setForm({ ...form, payload: e.target.value })}
            error={(() => {
              try {
                if (form.payload) JSON.parse(form.payload);
                return null;
              } catch (e) {
                return "Invalid JSON format";
              }
            })()}
            styles={{ input: { fontFamily: 'monospace' } }}
          />

          {signature && (
            <Paper withBorder p="md">
              <Stack
                gap="xs"
                style={{ width: '100%' }}
              >
                <Group
                  justify="space-between"
                  style={{ width: '100%' }}
                >
                  <Text fw={500}>Signature</Text>
                  <CopyButton value={signature}>
                    {({ copied, copy }) => (
                      <Button
                        variant="subtle"
                        size="xs"
                        color={copied ? 'green' : 'blue'}
                        onClick={copy}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <Code block>{signature}</Code>
              </Stack>
            </Paper>
          )}

          {curlCommand && (
            <Paper withBorder p="md">
              <Stack
                gap="xs"
                style={{ width: '100%' }}
              >
                <Group
                  justify="space-between"
                  style={{ width: '100%' }}
                >
                  <Text fw={500}>cURL Command</Text>
                  <CopyButton value={curlCommand}>
                    {({ copied, copy }) => (
                      <Button
                        variant="subtle"
                        size="xs"
                        color={copied ? 'green' : 'blue'}
                        onClick={copy}
                      >
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </CopyButton>
                </Group>
                <Code block>{curlCommand}</Code>
              </Stack>
            </Paper>
          )}

          <Button
            loading={loading}
            disabled={!form.payload || !form.event_type || !secretKey}
            onClick={executeCurl}
          >
            Trigger Webhook
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
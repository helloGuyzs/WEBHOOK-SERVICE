import { Card, Title, Group, Badge, Table, Text, Stack, Container, Paper, Box, Flex, Divider, ActionIcon, Tooltip, Collapse, Button, Tabs } from '@mantine/core';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { webhookService } from '../../services/webhookService';
import { IconRefresh, IconArrowBack, IconChevronDown, IconChevronUp, IconList, IconTerminal } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import React from 'react';
import { WebhookTrigger } from '../webhooks/WebhookTrigger';

export function SubscriptionDetails() {
  const { id } = useParams<{ id: string }>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);
  const [expandedDelivery, setExpandedDelivery] = useState<number | null>(null);
  
  const { data: deliveries, isLoading, refetch } = useQuery(
    ['deliveries', id, refreshKey],
    () => webhookService.getRecentDeliveries(Number(id))
  );

  useEffect(() => {
    setFadeIn(true);
    const timer = setTimeout(() => setFadeIn(false), 300);
    return () => clearTimeout(timer);
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    notifications.show({
      title: 'Refreshing',
      message: 'Fetching latest deliveries...',
      color: 'blue',
      autoClose: 2000
    });
  };

  const toggleDeliveryDetails = (deliveryId: number) => {
    setExpandedDelivery(expandedDelivery === deliveryId ? null : deliveryId);
  };

  // Helper function to safely display JSON data
  const formatJsonDisplay = (data: any) => {
    if (!data) return '';
    
    if (typeof data === 'string') {
      try {
        // Try to parse if it's a JSON string
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch (e) {
        // If not valid JSON, return as is
        return data;
      }
    }
    
    // If it's already an object, stringify it
    return JSON.stringify(data, null, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return {
          background: 'linear-gradient(45deg, #4CAF50 0%, #81C784 100%)',
          color: 'white'
        };
      case 'pending_retry':
        return {
          background: 'linear-gradient(45deg, #FFA726 0%, #FFB74D 100%)',
          color: 'white'
        };
      case 'failed':
        return {
          background: 'linear-gradient(45deg, #F44336 0%, #E57373 100%)',
          color: 'white'
        };
      case 'in_progress':
        return {
          background: 'linear-gradient(45deg, #2196F3 0%, #64B5F6 100%)',
          color: 'white'
        };
      default:
        return {
          background: 'linear-gradient(45deg, #9E9E9E 0%, #BDBDBD 100%)',
          color: 'white'
        };
    }
  };

  if (isLoading) return (
    <Flex justify="center" align="center" h="70vh">
      <Text size="xl" fw={500}>Loading delivery details...</Text>
    </Flex>
  );

  return (
    <Container size="xl" py="xl" mt={60}>
      <Tabs defaultValue="deliveries">
        <Tabs.List mb="xl">
          <Tabs.Tab value="deliveries" leftSection={<IconList size={16} />}>Recent Deliveries</Tabs.Tab>
          <Tabs.Tab value="trigger" leftSection={<IconTerminal size={16} />}>Trigger Webhook</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="deliveries">
          <Paper shadow="md" radius="lg" p="xl" withBorder>
            <Group justify="space-between" mb="xl">
              <Group>
                <Button 
                  component={Link} 
                  to="/subscriptions" 
                  variant="light" 
                  leftSection={<IconArrowBack size={16} />}
                >
                  Back to Subscriptions
                </Button>
              </Group>
              <Tooltip label="Refresh deliveries">
                <ActionIcon 
                  variant="light" 
                  color="blue" 
                  size="lg" 
                  onClick={handleRefresh}
                  className={fadeIn ? 'rotate-animation' : ''}
                >
                  <IconRefresh size={20} />
                </ActionIcon>
              </Tooltip>
            </Group>
            
            <Title order={3} mb="lg">Recent Webhook Deliveries</Title>
            
            {deliveries && deliveries.length > 0 ? (
              <Table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Event Type</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Last Attempt</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((delivery) => (
                    <React.Fragment key={delivery.id}>
                      <tr>
                        <td>{delivery.id}</td>
                        <td>
                          <Badge color="blue">
                            {delivery.event_type}
                          </Badge>
                        </td>
                        <td>
                          <Badge 
                            variant="filled"
                            radius="sm"
                            style={getStatusColor(delivery.status)}
                          >
                            {delivery.status}
                          </Badge>
                        </td>
                        <td>{new Date(delivery.created_at).toLocaleString()}</td>
                        <td>{delivery.last_attempt ? new Date(delivery.last_attempt).toLocaleString() : 'N/A'}</td>
                        <td>
                          <Button 
                            variant="subtle" 
                            size="xs"
                            onClick={() => toggleDeliveryDetails(delivery.id)}
                            rightSection={expandedDelivery === delivery.id ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                          >
                            {expandedDelivery === delivery.id ? 'Hide' : 'Show'}
                          </Button>
                        </td>
                      </tr>
                      {expandedDelivery === delivery.id && (
                        <tr>
                          <td colSpan={6}>
                            <Collapse in={expandedDelivery === delivery.id}>
                              <Box p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                                <Title order={5} mb="xs">Payload:</Title>
                                <Paper withBorder p="sm" style={{ background: '#f8f9fa' }}>
                                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                    {formatJsonDisplay(delivery.payload)}
                                  </pre>
                                </Paper>
                                
                                {delivery.attempts && delivery.attempts.length > 0 && (
                                  <>
                                    <Title order={5} mt="md" mb="xs">Delivery Attempts:</Title>
                                    <Table>
                                      <thead>
                                        <tr>
                                          <th>Attempt #</th>
                                          <th>Timestamp</th>
                                          <th>Status</th>
                                          <th>Response</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {delivery.attempts.map((attempt, index) => (
                                          <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{new Date(attempt.timestamp).toLocaleString()}</td>
                                            <td>
                                              <Badge 
                                                size="sm"
                                                color={attempt.success ? 'green' : 'red'}
                                              >
                                                {attempt.success ? 'SUCCESS' : 'FAILED'}
                                              </Badge>
                                            </td>
                                            <td>
                                              <Text size="sm">
                                                {attempt.response_code} - {attempt.response_message || 'No message'}
                                              </Text>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </>
                                )}
                              </Box>
                            </Collapse>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Text c="dimmed" ta="center" py="xl">No webhook deliveries found for this subscription.</Text>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="trigger">
          <WebhookTrigger />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
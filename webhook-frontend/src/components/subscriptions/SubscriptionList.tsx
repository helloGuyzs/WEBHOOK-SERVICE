import { Table, Button, Group, Card, Text, Badge, Container, Paper, Title, ActionIcon, Transition, Box, Flex, Center } from '@mantine/core';
import { useQuery, useQueryClient } from 'react-query';
import { subscriptionService } from '../../services/subscriptionService';
import { Link } from 'react-router-dom';
import { IconPlus, IconEye, IconTrash, IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';

export function SubscriptionList() {
  const queryClient = useQueryClient();
  const { data: subscriptions, isLoading, refetch } = useQuery(
    'subscriptions',
    subscriptionService.getAll
  );
  
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await subscriptionService.delete(id);
      queryClient.invalidateQueries('subscriptions');
      notifications.show({
        title: 'Success',
        message: 'Subscription deleted successfully',
        color: '#4CAF50'
      });
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to delete subscription',
        color: '#F44336'
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    notifications.show({
      title: 'Refreshing',
      message: 'Fetching latest subscriptions...',
      color: '#2196F3'
    });
  };

  if (isLoading) return (
    <Center h="70vh">
      <Text size="xl" fw={500}>Loading subscriptions...</Text>
    </Center>
  );

  return (
    <Container size="100%" p="xl" style={{ width: '100%', maxWidth: '100%' }}>
      <Paper shadow="md" radius="lg" p="xl" withBorder style={{ 
        width: '100%', 
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
      }}>
        <Flex justify="space-between" align="center" mb="xl">
          <Title order={2} fw={700} style={{ 
            background: 'linear-gradient(90deg, #1A237E 0%, #3949AB 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Subscriptions
          </Title>
          <Group>
            <ActionIcon 
              variant="light" 
              color="blue" 
              size="lg" 
              radius="xl"
              onClick={handleRefresh}
              className="refresh-button"
            >
              <IconRefresh size={20} />
            </ActionIcon>
            <Button 
              component={Link} 
              to="/subscriptions/new" 
              leftSection={<IconPlus size={16} />}
              variant="filled"
              radius="md"
              size="md"
              style={{
                background: 'linear-gradient(45deg, #4CAF50 0%, #2196F3 100%)',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
              className="create-button"
            >
              Create New
            </Button>
          </Group>
        </Flex>
        
        <Box style={{ width: '100%', overflow: 'hidden', borderRadius: '12px' }}>
          <Table striped highlightOnHover withTableBorder withColumnBorders style={{ width: '100%' }}>
            <Table.Thead style={{ background: 'linear-gradient(90deg, #E3F2FD 0%, #BBDEFB 100%)' }}>
              <Table.Tr>
                <Table.Th style={{ width: '5%' }}>ID</Table.Th>
                <Table.Th style={{ width: '40%' }}>Target URL</Table.Th>
                <Table.Th style={{ width: '20%' }}>Event Types</Table.Th>
                <Table.Th style={{ width: '15%' }}>Status</Table.Th>
                <Table.Th style={{ width: '20%', textAlign: 'center' }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {subscriptions?.map((sub) => (
                <Table.Tr 
                  key={sub.id}
                  onMouseEnter={() => setHoveredRow(sub.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ 
                    transition: 'all 0.2s ease',
                  }}
                  className="table-row-hover"
                >
                  <Table.Td>{sub.id}</Table.Td>
                  <Table.Td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {sub.target_url}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={5}>
                      {sub.event_types.map((type) => (
                        <Badge 
                          key={type} 
                          variant="light"
                          radius="sm"
                          style={{
                            background: 'linear-gradient(45deg, #E3F2FD 0%, #BBDEFB 100%)',
                            color: '#1565C0',
                            border: '1px solid #90CAF9'
                          }}
                        >
                          {type}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      variant="filled"
                      radius="sm"
                      style={{
                        background: sub.is_active 
                          ? 'linear-gradient(45deg, #4CAF50 0%, #81C784 100%)' 
                          : 'linear-gradient(45deg, #F44336 0%, #E57373 100%)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      {sub.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={8} justify="center">
                      <ActionIcon 
                        variant="filled"
                        component={Link}
                        to={`/subscriptions/${sub.id}`}
                        radius="md"
                        size="lg"
                        style={{
                          background: 'linear-gradient(45deg, #2196F3 0%, #64B5F6 100%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transform: hoveredRow === sub.id ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <IconEye size={18} />
                      </ActionIcon>
                      <ActionIcon 
                        variant="filled"
                        onClick={() => handleDelete(sub.id)}
                        radius="md"
                        size="lg"
                        style={{
                          background: 'linear-gradient(45deg, #F44336 0%, #E57373 100%)',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          transform: hoveredRow === sub.id ? 'scale(1.1)' : 'scale(1)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      </Paper>
    </Container>
  );
}
import { Table, Card, Title, Badge, Text } from '@mantine/core';
import { useQuery } from 'react-query';
import { webhookService } from '../../services/webhookService';

export function WebhookList() {
    const { data: webhooks, isLoading } = useQuery(
        'webhooks',
        webhookService.getAll
    );

    if (isLoading) return <Text>Loading...</Text>;

    return (
        <Card>
            <Title order={2} mb="md">Recent Webhooks</Title>
            <Table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Event Type</th>
                        <th>Attempts</th>
                        <th>Last Attempt</th>
                    </tr>
                </thead>
                <tbody>
                    {webhooks?.map((webhook) => (
                        <tr key={webhook.id}>
                            <td>{webhook.id}</td>
                            <td>
                                <Badge 
                                    color={
                                        webhook.status === 'COMPLETED' ? 'green' : 
                                        webhook.status === 'FAILED' ? 'red' : 'yellow'
                                    }
                                >
                                    {webhook.status}
                                </Badge>
                            </td>
                            <td>{webhook.event_type}</td>
                            <td>{webhook.attempt_count}</td>
                            <td>{webhook.last_attempt ? new Date(webhook.last_attempt).toLocaleString() : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Card>
    );
}
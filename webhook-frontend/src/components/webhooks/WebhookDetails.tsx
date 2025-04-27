import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Card, Title, Table, Badge, Stack, Text } from '@mantine/core';
import { webhookService } from '../../services/webhookService';

export function WebhookDetails() {
    const { id } = useParams<{ id: string }>();
    const { data: webhook, isLoading } = useQuery(
        ['webhook', id],
        () => webhookService.getDeliveryStatus(Number(id))
    );

    if (isLoading) return <Text>Loading...</Text>;
    if (!webhook) return <Text>Webhook not found</Text>;

    return (
        <Stack gap="md">
            <Card>
                <Title order={2} mb="md">Webhook Delivery Details</Title>
                <Table>
                    <tbody>
                        <tr>
                            <td>Status</td>
                            <td>
                                <Badge color={webhook.status === 'COMPLETED' ? 'green' : 'red'}>
                                    {webhook.status}
                                </Badge>
                            </td>
                        </tr>
                        <tr>
                            <td>Attempts</td>
                            <td>{webhook.attempt_count}</td>
                        </tr>
                        <tr>
                            <td>Next Retry</td>
                            <td>{webhook.next_retry ? new Date(webhook.next_retry).toLocaleString() : 'N/A'}</td>
                        </tr>
                    </tbody>
                </Table>
            </Card>
        </Stack>
    );
}
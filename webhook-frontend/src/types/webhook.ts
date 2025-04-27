export interface DeliveryAttempt {
    id: number;
    delivery_id: number;
    timestamp: string;
    success: boolean;
    response_code: number;
    response_message: string | null;
    response_body: string | null;
  }
  
  export interface WebhookDelivery {
    id: number;
    subscription_id: number;
    status: string;
    event_type: string;
    attempt_count: number;
    created_at: string;
    last_attempt: string | null;
    next_retry: string | null;
    response_code?: number;
    response_body?: string;
    payload?: any;
    attempts: DeliveryAttempt[];
  }
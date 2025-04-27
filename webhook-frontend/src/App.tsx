import { MantineProvider, createTheme, MantineColorScheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from 'react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { SubscriptionList } from './components/subscriptions/SubscriptionList';
import { SubscriptionForm } from './components/subscriptions/SubscriptionForm';
import { SubscriptionDetails } from './components/subscriptions/SubscriptionDetails';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './style.css';
import { useState } from 'react';
import { WebhookTrigger } from './components/webhooks/WebhookTrigger';

const queryClient = new QueryClient();

const theme = createTheme({
  primaryColor: 'blue',
  primaryShade: 6,
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        p: 'xl',
      },
    },
    AppShell: {
      styles: {
        main: {
          background: 'linear-gradient(135deg, #e0f7fa 0%, #bbdefb 50%, #c5cae9 100%)',
          width: '100%',
          minHeight: '100vh',
        }
      }
    }
  },
});

function App() {
  const [colorScheme, setColorScheme] = useState<MantineColorScheme>('light');

  const toggleColorScheme = (value?: MantineColorScheme) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme={colorScheme}>
        <Notifications position="top-right" />
        <BrowserRouter>
          <Layout toggleColorScheme={toggleColorScheme} colorScheme={colorScheme}>
            <Routes>
              <Route path="/" element={<SubscriptionList />} />
              <Route path="/subscriptions" element={<SubscriptionList />} />
              <Route path="/subscriptions/new" element={<SubscriptionForm />} />
              <Route path="/subscriptions/:id" element={<SubscriptionDetails />} />
              <Route path="/webhook-trigger" element={<WebhookTrigger />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
import { Group, Title, Button, ActionIcon } from '@mantine/core';
import { Link, useLocation } from 'react-router-dom';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { MantineColorScheme } from '@mantine/core';

interface NavbarProps {
  toggleColorScheme: (value?: MantineColorScheme) => void;
  colorScheme: MantineColorScheme;
}

export function Navbar({ toggleColorScheme, colorScheme }: NavbarProps) {
  const location = useLocation();

  return (
    <Group justify="space-between" h="100%">
      <Title order={3} c="white">Webhook Service</Title>
      <Group>
        <Button 
          component={Link} 
          to="/subscriptions" 
          variant={location.pathname.includes('/subscriptions') ? 'filled' : 'light'}
        >
          Subscriptions
        </Button>
        <ActionIcon 
          variant="outline" 
          onClick={() => toggleColorScheme()} 
          title="Toggle color scheme"
          c="white"
        >
          {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
      </Group>
    </Group>
  );
}
import { AppShell, Box } from '@mantine/core';
import { Navbar } from './Navbar';
import { MantineColorScheme } from '@mantine/core';

interface LayoutProps {
  children: React.ReactNode;
  toggleColorScheme: (value?: MantineColorScheme) => void;
  colorScheme: MantineColorScheme;
}

export function Layout({ children, toggleColorScheme, colorScheme }: LayoutProps) {
  return (
    <AppShell
      header={{ height: 60 }}
      padding="md"
      styles={{
        main: {
          width: '100%',
          padding: '0',
        }
      }}
    >
      <AppShell.Header style={{ 
        background: 'linear-gradient(90deg, #1A237E 0%, #3949AB 100%)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <Box p="md" style={{ width: '100%' }}>
          <Navbar toggleColorScheme={toggleColorScheme} colorScheme={colorScheme} />
        </Box>
      </AppShell.Header>

      <AppShell.Main style={{ width: '100%' }}>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
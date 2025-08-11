import React from 'react';
import { Box } from 'native-base';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: React.ReactNode;
  bg?: string;
  p?: number;
}

export default function ScreenLayout({ 
  children, 
  bg = 'gray.50', 
  p = 0 
}: ScreenLayoutProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <Box flex={1} bg={bg} p={p}>
        {children}
      </Box>
    </SafeAreaView>
  );
}
import React from 'react';
import { HStack, Text, IconButton, Box, Pressable } from 'native-base';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function AppHeader({ 
  title, 
  showBackButton = false, 
  onBackPress,
  rightElement 
}: AppHeaderProps) {
  return (
    <Box bg="blue.500" safeAreaTop shadow={3}>
      <HStack 
        alignItems="center" 
        justifyContent="space-between" 
        px={4} 
        py={3}
        minH={12}
      >
        {/* Left side - Back button */}
        <Box width={10}>
          {showBackButton && (
            <Pressable
              onPress={onBackPress}
              borderRadius="full"
              p={2}
              _pressed={{ bg: 'blue.600' }}
              _hover={{ bg: 'blue.600' }}
            >
              <Text color="white" fontSize="xl" fontWeight="bold">
                ←
              </Text>
            </Pressable>
          )}
        </Box>
        
        {/* Center - Title */}
        <Text 
          color="white" 
          fontSize="lg" 
          fontWeight="bold" 
          flex={1}
          textAlign="center"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        
        {/* Right side - Right element */}
        <Box width={10} alignItems="flex-end">
          {rightElement}
        </Box>
      </HStack>
    </Box>
  );
}
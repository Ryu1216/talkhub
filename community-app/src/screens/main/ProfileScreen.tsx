import React from 'react';
import { VStack, Text, Button } from 'native-base';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../types';
import { ScreenLayout, AppHeader } from '../../components/common';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  return (
    <ScreenLayout>
      <AppHeader 
        title="프로필" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      <VStack flex={1} space={4} p={4}>
        <Text>사용자 프로필 정보가 여기에 표시됩니다.</Text>
        
        <Button 
          onPress={() => navigation.goBack()}
          variant="outline"
          colorScheme="blue"
        >
          뒤로가기
        </Button>
      </VStack>
    </ScreenLayout>
  );
}
import React from 'react';
import { VStack, Heading, Text, HStack } from 'native-base';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { ScreenLayout } from '../../components/common';
import { AuthForm } from '../../components/auth';
import { useAuthStore } from '../../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register, loading, error, clearError } = useAuthStore();

  const handleRegister = async (email: string, password: string) => {
    await register(email, password);
  };

  return (
    <ScreenLayout>
      <VStack flex={1} justifyContent="center" space={6} px={6}>
        <VStack space={2} alignItems="center">
          <Heading size="xl" color="blue.600">
            회원가입
          </Heading>
          <Text color="gray.500" textAlign="center">
            새 계정을 만들어 커뮤니티에 참여하세요
          </Text>
        </VStack>

        <AuthForm
          mode="register"
          onSubmit={handleRegister}
          loading={loading}
          error={error}
          onClearError={clearError}
        />

        <HStack justifyContent="center" space={1}>
          <Text color="gray.500">
            이미 계정이 있으신가요?
          </Text>
          <Text 
            color="blue.500" 
            fontWeight="medium"
            onPress={() => navigation.navigate('Login')}
          >
            로그인하기
          </Text>
        </HStack>
      </VStack>
    </ScreenLayout>
  );
}
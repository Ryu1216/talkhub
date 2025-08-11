import React from 'react';
import { VStack, Heading, Text, HStack } from 'native-base';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../types';
import { ScreenLayout } from '../../components/common';
import { AuthForm } from '../../components/auth';
import { useAuthStore } from '../../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, loading, error, clearError } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };

  return (
    <ScreenLayout>
      <VStack flex={1} justifyContent="center" space={6} px={6}>
        <VStack space={2} alignItems="center">
          <Heading size="xl" color="blue.600">
            로그인
          </Heading>
          <Text color="gray.500" textAlign="center">
            계정에 로그인하여 커뮤니티에 참여하세요
          </Text>
        </VStack>

        <AuthForm
          mode="login"
          onSubmit={handleLogin}
          loading={loading}
          error={error}
          onClearError={clearError}
        />

        <HStack justifyContent="center" space={1}>
          <Text color="gray.500">
            계정이 없으신가요?
          </Text>
          <Text 
            color="blue.500" 
            fontWeight="medium"
            onPress={() => navigation.navigate('Register')}
          >
            회원가입하기
          </Text>
        </HStack>
      </VStack>
    </ScreenLayout>
  );
}
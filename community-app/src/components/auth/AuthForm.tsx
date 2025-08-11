import React, { useState } from 'react';
import {
  VStack,
  FormControl,
  Input,
  Button,
  Text,
  Alert,
  HStack,
  Icon,
  Pressable,
} from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { validateEmail, validatePassword, validateRequired } from '../../utils';
import { ERROR_MESSAGES } from '../../constants';
import { AppError } from '../../types';

export interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: AppError | null;
  onClearError: () => void;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  mode,
  onSubmit,
  loading,
  error,
  onClearError,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const isLogin = mode === 'login';
  const buttonText = isLogin ? '로그인' : '회원가입';
  const title = isLogin ? '로그인' : '회원가입';

  // Real-time validation
  const validateField = (field: 'email' | 'password', value: string): string | undefined => {
    switch (field) {
      case 'email':
        if (!validateRequired(value)) {
          return ERROR_MESSAGES.VALIDATION_REQUIRED_FIELD;
        }
        if (!validateEmail(value)) {
          return ERROR_MESSAGES.AUTH_INVALID_EMAIL;
        }
        return undefined;
      case 'password':
        if (!validateRequired(value)) {
          return ERROR_MESSAGES.VALIDATION_REQUIRED_FIELD;
        }
        if (!validatePassword(value)) {
          return ERROR_MESSAGES.AUTH_WEAK_PASSWORD;
        }
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (field: 'email' | 'password', value: string) => {
    // Clear global error when user starts typing
    if (error) {
      onClearError();
    }

    if (field === 'email') {
      setEmail(value);
      if (touched.email) {
        const emailError = validateField('email', value);
        setFormErrors(prev => ({ ...prev, email: emailError }));
      }
    } else {
      setPassword(value);
      if (touched.password) {
        const passwordError = validateField('password', value);
        setFormErrors(prev => ({ ...prev, password: passwordError }));
      }
    }
  };

  const handleFieldBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const value = field === 'email' ? email : password;
    const fieldError = validateField(field, value);
    setFormErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const validateForm = (): boolean => {
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    
    setFormErrors({
      email: emailError,
      password: passwordError,
    });
    
    setTouched({ email: true, password: true });
    
    return !emailError && !passwordError;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(email, password);
    } catch (err) {
      // Error handling is managed by the parent component through the error prop
      console.error('Form submission error:', err);
    }
  };

  return (
    <VStack space={4} width="100%">
      {/* Global Error Alert */}
      {error && (
        <Alert status="error" variant="left-accent">
          <VStack space={1} flexShrink={1} w="100%">
            <HStack flexShrink={1} space={2} alignItems="center">
              <Alert.Icon />
              <Text fontSize="md" fontWeight="medium" color="coolGray.800">
                오류
              </Text>
            </HStack>
            <Text px="6" color="coolGray.600">
              {error.message}
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Email Field */}
      <FormControl isInvalid={!!formErrors.email && touched.email}>
        <FormControl.Label>이메일</FormControl.Label>
        <Input
          value={email}
          onChangeText={(value) => handleFieldChange('email', value)}
          onBlur={() => handleFieldBlur('email')}
          placeholder="이메일을 입력하세요"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          isDisabled={loading}
          InputLeftElement={
            <Icon
              as={<MaterialIcons name="email" />}
              size={5}
              ml="2"
              color="muted.400"
            />
          }
        />
        <FormControl.ErrorMessage>
          {formErrors.email}
        </FormControl.ErrorMessage>
      </FormControl>

      {/* Password Field */}
      <FormControl isInvalid={!!formErrors.password && touched.password}>
        <FormControl.Label>비밀번호</FormControl.Label>
        <Input
          value={password}
          onChangeText={(value) => handleFieldChange('password', value)}
          onBlur={() => handleFieldBlur('password')}
          placeholder="비밀번호를 입력하세요"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          isDisabled={loading}
          InputLeftElement={
            <Icon
              as={<MaterialIcons name="lock" />}
              size={5}
              ml="2"
              color="muted.400"
            />
          }
          InputRightElement={
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Icon
                as={<MaterialIcons name={showPassword ? "visibility" : "visibility-off"} />}
                size={5}
                mr="2"
                color="muted.400"
              />
            </Pressable>
          }
        />
        <FormControl.ErrorMessage>
          {formErrors.password}
        </FormControl.ErrorMessage>
        {!isLogin && !formErrors.password && (
          <FormControl.HelperText>
            비밀번호는 최소 6자 이상이어야 합니다.
          </FormControl.HelperText>
        )}
      </FormControl>

      {/* Submit Button */}
      <Button
        onPress={handleSubmit}
        isLoading={loading}
        isLoadingText={`${buttonText} 중...`}
        isDisabled={loading}
        size="lg"
        colorScheme="blue"
        _text={{
          fontWeight: 'bold',
        }}
      >
        {buttonText}
      </Button>
    </VStack>
  );
};
import React, { useState, useCallback, useEffect } from 'react';
import { VStack, ScrollView, useToast } from 'native-base';
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, CreatePostData } from '../../types';
import { ScreenLayout, AppHeader } from '../../components/common';
import { CreatePostForm } from '../../components/posts';
import { usePostsStore } from '../../stores';
import { useUnsavedChanges } from '../../hooks';

type Props = NativeStackScreenProps<MainStackParamList, 'CreatePost'>;

export default function CreatePostScreen({ navigation }: Props) {
  const { createPost, loading, error, clearError } = usePostsStore();
  const toast = useToast();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { confirmDiscard } = useUnsavedChanges({
    hasUnsavedChanges,
    onConfirmDiscard: () => navigation.goBack(),
  });

  const handleFormChange = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Handle Android hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          return !confirmDiscard(); // Return true to prevent default behavior if user cancels
        }
        return false; // Allow default behavior
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [hasUnsavedChanges, confirmDiscard])
  );

  const handleSubmit = async (data: CreatePostData) => {
    try {
      await createPost(data);
      
      // Clear unsaved changes state since form was successfully submitted
      setHasUnsavedChanges(false);
      
      // Show success message
      toast.show({
        title: '게시글 작성 완료',
        description: '게시글이 성공적으로 작성되었습니다.',
        status: 'success',
      });
      
      // Navigate back to home screen
      navigation.navigate('Home');
    } catch (err) {
      // Error is handled by the store and passed to the form
      console.error('Create post error:', err);
      
      // Show error toast as backup
      toast.show({
        title: '게시글 작성 실패',
        description: '게시글 작성 중 오류가 발생했습니다. 다시 시도해주세요.',
        status: 'error',
      });
    }
  };

  const handleBackPress = () => {
    if (confirmDiscard()) {
      navigation.goBack();
    }
  };

  return (
    <ScreenLayout>
      <AppHeader 
        title="게시글 작성" 
        showBackButton 
        onBackPress={handleBackPress}
      />
      <ScrollView 
        flex={1} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <VStack p={4} space={4}>
          <CreatePostForm
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
            onClearError={clearError}
            onFormChange={handleFormChange}
          />
        </VStack>
      </ScrollView>
    </ScreenLayout>
  );
}
import React from 'react';
import { VStack, Button, HStack, IconButton, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList, Post } from '../../types';
import { ScreenLayout, AppHeader } from '../../components/common';
import { PostsList } from '../../components/posts';

type Props = NativeStackScreenProps<MainStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <ScreenLayout>
      <AppHeader 
        title="커뮤니티 홈" 
        rightElement={
          <HStack space={2}>
            <IconButton
              icon={<Icon as={Ionicons} name="person-outline" />}
              onPress={handleProfile}
              _icon={{ color: 'white', size: 'sm' }}
              _pressed={{ bg: 'blue.600' }}
            />
            <IconButton
              icon={<Icon as={Ionicons} name="add" />}
              onPress={handleCreatePost}
              _icon={{ color: 'white', size: 'md' }}
              _pressed={{ bg: 'blue.600' }}
            />
          </HStack>
        }
      />
      
      <PostsList onPostPress={handlePostPress} />
    </ScreenLayout>
  );
}
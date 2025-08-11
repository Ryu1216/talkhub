import { useState, useEffect } from 'react';
import { Alert } from 'react-native';

export interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean;
  onConfirmDiscard?: () => void;
}

export const useUnsavedChanges = ({ 
  hasUnsavedChanges, 
  onConfirmDiscard 
}: UseUnsavedChangesOptions) => {
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const confirmDiscard = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        '변경사항 삭제',
        '작성 중인 내용이 있습니다. 정말로 나가시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '나가기',
            style: 'destructive',
            onPress: onConfirmDiscard,
          },
        ]
      );
      return false; // Prevent navigation
    }
    return true; // Allow navigation
  };

  return {
    confirmDiscard,
    hasUnsavedChanges,
  };
};
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image, Pressable, Platform } from 'react-native';
import { showErrorAlert, showSuccessAlert, showConfirmAlert } from '@/utils/alert';
import { validateFolderName, validateFolderNameInput } from '@/utils/folderValidation';
import { styles } from '@/styles/screens/file/FileScreen';
import { GroupAPI, FileAPI, API_BASE_URL } from '@/services/api';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { getSubjectFromToken } from '@/services/jwt';
import * as ImagePicker from 'expo-image-picker';

type GroupCard = {
  groupId?: number;
  groupNm: string;
  groupMstUserNm?: string;
  regDtm?: string;
};

type FileTableDTO = {
  fileId?: number;
  fileNm: string;
  fileOrgNm: string;
  filePath: string;
  type: 'DIR' | 'FILE';
  parentId: number;
  groupId: number;
  regDtm: string;
  regId: string;
  modDtm: string;
  modId: string;
};

export default function FileScreen() {
  const [groups, setGroups] = useState<GroupCard[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupCard | null>(null);
  const [filesAndDirectories, setFilesAndDirectories] = useState<FileTableDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [viewMode, setViewMode] = useState<'groups' | 'files'>('groups');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderValidation, setFolderValidation] = useState<{
    isValid: boolean;
    errorMessage?: string;
    sanitizedSuggestion?: string;
  }>({ isValid: true });
  const [currentParentId, setCurrentParentId] = useState<number>(2); // 현재 디렉토리의 parentId
  const [directoryStack, setDirectoryStack] = useState<Array<{ id: number; name: string }>>([]); // 디렉토리 탐색 경로
  const [currentDirectoryName, setCurrentDirectoryName] = useState<string>(''); // 현재 디렉토리의 이름
  
  // 파일 업로드 관련 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 드래그 앤 드롭 관련 상태
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // 이미지 뷰어 관련 상태
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<FileTableDTO | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const accessToken = useSelector((s: RootState) => s.auth.accessToken);
  const subject = getSubjectFromToken(accessToken);

  // 그룹 목록을 로드하는 함수
  const loadGroups = useCallback(async () => {
    if (!subject) return;
    setLoading(true);
    try {
      const { data } = await GroupAPI.findGroupWhatInside(subject);
      setGroups(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('그룹 목록 조회 실패:', e);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [subject]);

  // 파일과 디렉토리 목록을 로드하는 함수
  const loadFilesAndDirectories = useCallback(async (groupId: number, parentId: number = 2) => {
    setLoadingFiles(true);
    try {
      const { data } = await FileAPI.findFileAndDirectory(parentId, groupId);
      setFilesAndDirectories(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error('파일 및 디렉토리 목록 조회 실패:', e);
      showErrorAlert('파일 및 디렉토리 목록을 불러올 수 없습니다.');
      setFilesAndDirectories([]);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  // 그룹 선택 시 파일/디렉토리 화면으로 전환
  const handleGroupSelect = (group: GroupCard) => {
    if (group.groupId) {
      setSelectedGroup(group);
      setViewMode('files');
      setCurrentParentId(2); // 루트 디렉토리로 초기화
      setDirectoryStack([]); // 디렉토리 스택 초기화
      setCurrentDirectoryName(group.groupNm); // 그룹 이름을 현재 디렉터리 이름으로 설정
      loadFilesAndDirectories(group.groupId, 2);
    }
  };

  // 뒤로 가기 (그룹 목록으로)
  const handleBackToGroups = () => {
    setViewMode('groups');
    setSelectedGroup(null);
    setFilesAndDirectories([]);
    setShowCreateFolder(false);
    setNewFolderName('');
    setCurrentParentId(2);
    setDirectoryStack([]);
    setCurrentDirectoryName('');
  };

  // 폴더명 입력 핸들러
  const handleFolderNameChange = (text: string) => {
    setNewFolderName(text);
    const validation = validateFolderNameInput(text);
    setFolderValidation(validation);
  };

  // 폴더 생성 모드 토글
  const toggleCreateFolder = () => {
    if (showCreateFolder) {
      // 폴더 생성 모드에서 나가기
      setShowCreateFolder(false);
      setNewFolderName('');
      setFolderValidation({ isValid: true });
    } else {
      // 폴더 생성 모드로 들어가기
      setShowCreateFolder(true);
    }
  };

  // 디렉토리 클릭 시 하위 디렉토리로 이동
  const handleDirectoryClick = (directory: FileTableDTO) => {
    if (directory.fileId && directory.type === 'DIR' && selectedGroup?.groupId) {
      const newStack = [...directoryStack, { id: currentParentId, name: directory.fileNm }];
      setDirectoryStack(newStack);
      setCurrentParentId(directory.fileId);
      setCurrentDirectoryName(directory.fileNm); // 현재 디렉터리 이름 업데이트
      loadFilesAndDirectories(selectedGroup.groupId, directory.fileId);
    }
  };

  // 상위 디렉토리로 이동
  const handleBackToParent = () => {
    if (directoryStack.length > 0 && selectedGroup?.groupId) {
      const parent = directoryStack[directoryStack.length - 1];
      const newStack = directoryStack.slice(0, -1);
      setDirectoryStack(newStack);
      setCurrentParentId(parent.id);
      // 상위 디렉터리 이름으로 업데이트
      setCurrentDirectoryName(newStack.length > 0 ? newStack[newStack.length - 1].name : selectedGroup.groupNm);
      loadFilesAndDirectories(selectedGroup.groupId, parent.id);
    }
  };

  // 파일 클릭 시 이미지 뷰어 열기
  const handleFileClick = async (file: FileTableDTO) => {
    if (file.type === 'FILE' && file.fileId) {
      setSelectedImageFile(file);
      setShowImageViewer(true);
      setImageLoading(true);
      
      try {
        // 파일 정보 조회
        const response = await FileAPI.findFileById(file.fileId);
        if (response && response.data) {
          // 파일 정보 업데이트 (필요한 경우)
          setSelectedImageFile(response.data);
        }
      } catch (error) {
        console.error('파일 정보 조회 실패:', error);
        showErrorAlert('파일 정보를 불러올 수 없습니다.');
      } finally {
        setImageLoading(false);
      }
    }
  };

  // 파일 삭제
  const handleDeleteFile = async (file: FileTableDTO) => {
    if (!file.fileId || !selectedGroup?.groupId) {
      return;
    }
    
    // 웹 환경에서는 window.confirm 사용
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`"${file.fileOrgNm}" 파일을 삭제하시겠습니까?`);
      if (confirmed) {
        try {
          const response = await FileAPI.deleteFile(file.fileId!);
          
          // ApiResponse 구조 확인
          if (response.data.success) {
            window.alert('파일이 삭제되었습니다.');
            
            // 이미지 뷰어 모달 닫기
            setShowImageViewer(false);
            setSelectedImageFile(null);
            
            // 삭제된 파일의 parentId로 이동
            const parentId = response.data.data.parentId;
            if (parentId) {
              setCurrentParentId(parentId);
              // 디렉터리 스택을 parentId에 맞게 조정
              if (parentId === 2) {
                // 루트 디렉터리로 이동
                setDirectoryStack([]);
                setCurrentDirectoryName(selectedGroup.groupNm);
              } else {
                // 상위 디렉터리로 이동
                const newStack = directoryStack.slice(0, -1);
                setDirectoryStack(newStack);
                setCurrentDirectoryName(newStack.length > 0 ? newStack[newStack.length - 1].name : selectedGroup.groupNm);
              }
              
              // 파일 목록 새로고침
              await loadFilesAndDirectories(selectedGroup.groupId, parentId);
            }
          } else {
            // API에서 에러 응답을 받은 경우
            const errorMessage = response.data.error?.message || '파일 삭제에 실패했습니다.';
            window.alert(errorMessage);
          }
        } catch (error: any) {
          console.error('파일 삭제 실패:', error);
          
          // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
          if (error.response && error.response.data) {
            const responseData = error.response.data;
            
            // ApiResponse 구조인 경우
            if (responseData.error && responseData.error.message) {
              window.alert(responseData.error.message);
            } else if (responseData.message) {
              window.alert(responseData.message);
            } else {
              window.alert('파일 삭제에 실패했습니다.');
            }
          } else {
            // 네트워크 에러나 기타 에러
            window.alert('파일 삭제에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
          }
        }
      }
    } else {
      // 네이티브 환경에서는 Alert.alert 사용
      showConfirmAlert(
        '파일 삭제',
        `"${file.fileOrgNm}" 파일을 삭제하시겠습니까?`,
        async () => {
              try {
                const response = await FileAPI.deleteFile(file.fileId!);
                
                // ApiResponse 구조 확인
                if (response.data.success) {
                  showSuccessAlert('파일이 삭제되었습니다.');
                  
                  // 이미지 뷰어 모달 닫기
                  setShowImageViewer(false);
                  setSelectedImageFile(null);
                  
                  // 삭제된 파일의 parentId로 이동
                  const parentId = response.data.data.parentId;
                  if (parentId) {
                    setCurrentParentId(parentId);
                    // 디렉터리 스택을 parentId에 맞게 조정
                    if (parentId === 2) {
                      // 루트 디렉터리로 이동
                      setDirectoryStack([]);
                      setCurrentDirectoryName(selectedGroup.groupNm);
                    } else {
                      // 상위 디렉터리로 이동
                      const newStack = directoryStack.slice(0, -1);
                      setDirectoryStack(newStack);
                      setCurrentDirectoryName(newStack.length > 0 ? newStack[newStack.length - 1].name : selectedGroup.groupNm);
                    }
                    
                    // 파일 목록 새로고침
                    await loadFilesAndDirectories(selectedGroup.groupId!, parentId);
                  }
                } else {
                  // API에서 에러 응답을 받은 경우
                  const errorMessage = response.data.error?.message || '파일 삭제에 실패했습니다.';
                  showErrorAlert(errorMessage);
                }
              } catch (error: any) {
                console.error('파일 삭제 실패:', error);
                
                // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
                if (error.response && error.response.data) {
                  const responseData = error.response.data;
                  
                  // ApiResponse 구조인 경우
                  if (responseData.error && responseData.error.message) {
                    showErrorAlert(responseData.error.message);
                  } else if (responseData.message) {
                    showErrorAlert(responseData.message);
                  } else {
                    showErrorAlert('파일 삭제에 실패했습니다.');
                  }
                } else {
                  // 네트워크 에러나 기타 에러
                  showErrorAlert('파일 삭제에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
                }
              }
        }
      );
    }
  };

  // 파일 다운로드
  const handleDownloadFile = async (file: FileTableDTO) => {
    try {
      // 웹 환경에서만 다운로드 기능 제공
      if (Platform.OS !== 'web') {
        showErrorAlert('다운로드 기능은 웹 환경에서만 사용할 수 있습니다.');
        return;
      }

      const imageUrl = `${API_BASE_URL}/GROUP_IMG/${file.filePath.replace(/^C:\\IMGD\\GROUP_IMG\\/, '').replace(/\\/g, '/')}`;
      
      // 파일명에서 확장자 추출
      const fileExtension = file.fileOrgNm.split('.').pop() || 'jpg';
      const fileName = file.fileOrgNm || `image_${Date.now()}.${fileExtension}`;
      
      // fetch를 사용하여 이미지 다운로드
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('이미지를 불러올 수 없습니다.');
      }
      
      const blob = await response.blob();
      
      // 다운로드 링크 생성 및 클릭
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccessAlert('파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      showErrorAlert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 폴더 삭제
  const handleDeleteFolder = async (folder: FileTableDTO) => {
    if (!folder.fileId || !selectedGroup?.groupId) {
      showErrorAlert('폴더 정보가 올바르지 않습니다.');
      return;
    }

    // 웹 환경에서는 window.confirm 사용
    if (typeof window !== 'undefined' && window.confirm) {
      const confirmed = window.confirm(`"${folder.fileNm}" 폴더를 삭제하시겠습니까?\n하위 파일과 폴더도 모두 삭제됩니다.`);
      if (confirmed) {
        try {
          const response = await FileAPI.deleteDir(folder.fileId!);
          
          // ApiResponse 구조 확인
          if (response.data.success) {
            window.alert('폴더가 삭제되었습니다.');
            
            // 삭제된 폴더의 parentId로 이동
            const parentId = response.data.data.parentId;
            if (parentId) {
              setCurrentParentId(parentId);
              // 디렉터리 스택을 parentId에 맞게 조정
              if (parentId === 2) {
                // 루트 디렉터리로 이동
                setDirectoryStack([]);
                setCurrentDirectoryName(selectedGroup.groupNm);
              } else {
                // 상위 디렉터리로 이동
                const newStack = directoryStack.slice(0, -1);
                setDirectoryStack(newStack);
                setCurrentDirectoryName(newStack.length > 0 ? newStack[newStack.length - 1].name : selectedGroup.groupNm);
              }
              
              // 파일 목록 새로고침
              await loadFilesAndDirectories(selectedGroup.groupId, parentId);
            }
          } else {
            // API에서 에러 응답을 받은 경우
            const errorMessage = response.data.error?.message || '폴더 삭제에 실패했습니다.';
            window.alert(errorMessage);
          }
        } catch (error: any) {
          console.error('폴더 삭제 실패:', error);
          
          // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
          if (error.response && error.response.data) {
            const responseData = error.response.data;
            
            // ApiResponse 구조인 경우
            if (responseData.error && responseData.error.message) {
              window.alert(responseData.error.message);
            } else if (responseData.message) {
              window.alert(responseData.message);
            } else {
              window.alert('폴더 삭제에 실패했습니다.');
            }
          } else {
            // 네트워크 에러나 기타 에러
            window.alert('폴더 삭제에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
          }
        }
      }
    } else {
      // 네이티브 환경에서는 Alert.alert 사용
      showConfirmAlert(
        '폴더 삭제',
        `"${folder.fileNm}" 폴더를 삭제하시겠습니까?\n하위 파일과 폴더도 모두 삭제됩니다.`,
        async () => {
              try {
                const response = await FileAPI.deleteDir(folder.fileId!);
                
                // ApiResponse 구조 확인
                if (response.data.success) {
                  showSuccessAlert('폴더가 삭제되었습니다.');
                  
                  // 삭제된 폴더의 parentId로 이동
                  const parentId = response.data.data.parentId;
                  if (parentId) {
                    setCurrentParentId(parentId);
                    // 디렉터리 스택을 parentId에 맞게 조정
                    if (parentId === 2) {
                      // 루트 디렉터리로 이동
                      setDirectoryStack([]);
                      setCurrentDirectoryName(selectedGroup.groupNm);
                    } else {
                      // 상위 디렉터리로 이동
                      const newStack = directoryStack.slice(0, -1);
                      setDirectoryStack(newStack);
                      setCurrentDirectoryName(newStack.length > 0 ? newStack[newStack.length - 1].name : selectedGroup.groupNm);
                    }
                    
                    // 파일 목록 새로고침
                    await loadFilesAndDirectories(selectedGroup.groupId!, parentId);
                  }
                } else {
                  // API에서 에러 응답을 받은 경우
                  const errorMessage = response.data.error?.message || '폴더 삭제에 실패했습니다.';
                  showErrorAlert(errorMessage);
                }
              } catch (error: any) {
                console.error('폴더 삭제 실패:', error);
                
                // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
                if (error.response && error.response.data) {
                  const responseData = error.response.data;
                  
                  // ApiResponse 구조인 경우
                  if (responseData.error && responseData.error.message) {
                    showErrorAlert(responseData.error.message);
                  } else if (responseData.message) {
                    showErrorAlert(responseData.message);
                  } else {
                    showErrorAlert('폴더 삭제에 실패했습니다.');
                  }
                } else {
                  // 네트워크 에러나 기타 에러
                  showErrorAlert('폴더 삭제에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
                }
              }
        }
      );
    }
  };

  // 파일 선택
  const handleSelectFile = async () => {
    try {
      // 이미지 선택 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showErrorAlert('갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

             if (!result.canceled && result.assets[0]) {
         const selectedImage = result.assets[0];
         
         // 파일 크기 정보 가져오기
         let fileSize = selectedImage.fileSize;
         
         // fileSize가 없으면 파일 정보에서 크기 추출 시도
         if (!fileSize && selectedImage.uri) {
           try {
             // 파일 크기 확인 (50MB 제한)
             if (fileSize && fileSize > 50 * 1024 * 1024) {
               showErrorAlert('파일 크기는 50MB를 초과할 수 없습니다.');
               return;
             }
           } catch (error) {
             console.log('파일 크기 확인 실패:', error);
           }
         }

         // 파일 확장자 확인 (.jpg, .png만 허용)
         const fileName = selectedImage.fileName || selectedImage.uri.split('/').pop() || '';
         const fileExtension = fileName.toLowerCase().split('.').pop() || '';
         
         if (!fileExtension || !['jpg', 'jpeg', 'png'].includes(fileExtension)) {
           showErrorAlert('JPG, PNG 파일만 업로드할 수 있습니다.');
           return;
         }

         // 파일 크기 정보가 포함된 객체 생성
         const fileInfo = {
           ...selectedImage,
           fileSize: fileSize || 0, // 크기를 알 수 없는 경우 0으로 설정
           displaySize: fileSize ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : '크기 확인 불가'
         };

         setSelectedFile(fileInfo);
       }
    } catch (error) {
      console.error('파일 선택 실패:', error);
      showErrorAlert('파일을 선택할 수 없습니다.');
    }
  };

  // 드래그 앤 드롭 이벤트 핸들러들 (웹 환경에서만 동작)
  const handleDragEnter = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: any) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    if (!selectedGroup?.groupId || !subject) {
      showErrorAlert('그룹을 선택해주세요.');
      return;
    }

    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length === 0) {
      return;
    }

    // 첫 번째 파일만 처리 (여러 파일 드롭 시)
    const file = files[0];
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      showErrorAlert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 크기 검증 (50MB 제한)
    if (file.size > 50 * 1024 * 1024) {
      showErrorAlert('파일 크기는 50MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 확장자 검증
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      showErrorAlert('JPG, PNG 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일을 ImagePicker 형식으로 변환
    const fileInfo = {
      uri: URL.createObjectURL(file),
      fileName: file.name,
      fileSize: file.size,
      displaySize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type
    };

    setSelectedFile(fileInfo);
    setShowUploadModal(true);
  }, [selectedGroup, subject]);

  // 파일 업로드
  const handleUploadFile = async () => {
    if (!selectedFile || !selectedGroup?.groupId || !subject) {
      showErrorAlert('파일을 선택해주세요.');
      return;
    }

    setUploadingFile(true);
    setUploadProgress(0);
    
    try {
      // 프로그레스 시뮬레이션 (실제 업로드 진행률을 추적하기 어려우므로 단계별로 진행)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90; // 90%에서 멈춤 (실제 완료 시 100%로 설정)
          }
          return newProgress;
        });
      }, 200);

      const response = await FileAPI.makeFile(
        selectedFile.uri,
        {
          folderId: currentParentId,
          userId: subject,
          groupId: selectedGroup.groupId!,
          fileName: (selectedFile.fileName as string) || `upload_${Date.now()}.jpg`
        },
        accessToken || undefined
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 프로그래스 바를 잠시 더 표시하기 위해 지연
      await new Promise(resolve => setTimeout(resolve, 500));

      // ApiResponse 구조 확인 (fetch API 사용으로 직접 응답)
      if (response.success) {
        showSuccessAlert('파일이 업로드되었습니다.');
        // 파일 목록 새로고침
        await loadFilesAndDirectories(selectedGroup.groupId, currentParentId);
        // 업로드 모달 닫기
        setShowUploadModal(false);
        setSelectedFile(null);
      } else {
        // API에서 에러 응답을 받은 경우
        const errorMessage = response.error?.message || '파일 업로드에 실패했습니다.';
        showErrorAlert(errorMessage);
      }
    } catch (error: any) {
      console.error('파일 업로드 실패:', error);
      
      // fetch API 에러 처리
      if (error && typeof error === 'object') {
        // ApiResponse 구조인 경우
        if (error.error && error.error.message) {
          showErrorAlert(error.error.message);
        } else if (error.message) {
          showErrorAlert(error.message);
        } else {
          showErrorAlert('파일 업로드에 실패했습니다.');
        }
      } else {
        // 네트워크 에러나 기타 에러
        showErrorAlert('파일 업로드에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
      }
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
    }
  };

  // 폴더 생성
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedGroup?.groupId || !subject) {
      showErrorAlert('폴더 이름을 입력해주세요.');
      return;
    }

    // 폴더명 유효성 검사
    const validation = validateFolderName(newFolderName.trim());
    if (!validation.isValid) {
      showErrorAlert(validation.errorMessage || '폴더명이 올바르지 않습니다.');
      return;
    }

    setCreatingFolder(true);
    try {
      const dto = {
        userId: subject,
        parentId: currentParentId, // 현재 디렉토리의 parentId
        dirNm: newFolderName.trim(),
        groupId: selectedGroup.groupId,
        path: currentDirectoryName // 현재 디렉터리의 이름을 path로 사용
      };

      const response = await FileAPI.makeDir(dto);
      
      // ApiResponse 구조 확인
      if (response.data.success) {
        showSuccessAlert('폴더가 생성되었습니다.');
        // 폴더 목록 새로고침 - 현재 위치한 디렉토리에서 새로고침
        await loadFilesAndDirectories(selectedGroup.groupId, currentParentId);
        // 폴더 생성 모드 완전 종료
        setShowCreateFolder(false);
        setNewFolderName('');
        setFolderValidation({ isValid: true });
        setCreatingFolder(false);
      } else {
        // API에서 에러 응답을 받은 경우
        const errorMessage = response.data.error?.message || '폴더 생성에 실패했습니다.';
        showErrorAlert(errorMessage);
        setCreatingFolder(false);
      }
    } catch (error: any) {
      console.error('폴더 생성 실패:', error);
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          showErrorAlert(responseData.error.message);
        } else if (responseData.message) {
          showErrorAlert(responseData.message);
        } else {
          showErrorAlert('폴더 생성에 실패했습니다.');
        }
      } else {
        // 네트워크 에러나 기타 에러
        showErrorAlert('폴더 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
      }
      setCreatingFolder(false);
    }
  };

  // 정리된 폴더명 적용
  const handleApplySanitizedName = () => {
    if (folderValidation.sanitizedSuggestion) {
      setNewFolderName(folderValidation.sanitizedSuggestion);
      setFolderValidation({ isValid: true });
    }
  };

  // 초기 로드
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 그룹 목록 화면
  const renderGroupsView = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>My Directory</Text>
        <Text style={styles.description}>그룹별 폴더 및 파일 관리</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>그룹 목록을 불러오는 중...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>소속된 그룹이 없습니다</Text>
          </View>
        ) : (
          groups.map((group, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.groupCard}
              onPress={() => handleGroupSelect(group)}
            >
              <View style={styles.groupHeader}>
                <View style={styles.groupIcon}>
                  <Text style={styles.groupIconText}>📁</Text>
                </View>
                <View style={styles.groupMainInfo}>
                  <Text style={styles.groupName}>{group.groupNm}</Text>
                  <Text style={styles.groupSubtitle}>그룹 디렉토리</Text>
                </View>
                <View style={styles.groupActions}>
                  <View style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>📂</Text>
                  </View>
                </View>
              </View>
              <View style={styles.groupDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>그룹장</Text>
                  <Text style={styles.detailValue}>{group.groupMstUserNm || 'N/A'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>생성일</Text>
                  <Text style={styles.detailValue}>{group.regDtm || 'N/A'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
             </ScrollView>
     </>
   );

   // 이미지 뷰어 모달
   const renderImageViewerModal = () => (
     <Modal
       visible={showImageViewer}
       transparent={true}
       animationType="fade"
       onRequestClose={() => setShowImageViewer(false)}
     >
       <View style={styles.imageViewerOverlay}>
         <View style={styles.imageViewerContent}>
           <View style={styles.imageViewerHeader}>
             <Text style={styles.imageViewerTitle}>
               {selectedImageFile?.fileOrgNm || '이미지 뷰어'}
             </Text>
             <View style={styles.imageViewerActions}>
               <TouchableOpacity 
                 onPress={() => selectedImageFile && handleDownloadFile(selectedImageFile)}
                 style={styles.imageViewerDownloadButton}
               >
                 <Text style={styles.imageViewerDownloadButtonText}>⬇️</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => selectedImageFile && handleDeleteFile(selectedImageFile)}
                 style={styles.imageViewerDeleteButton}
               >
                 <Text style={styles.imageViewerDeleteButtonText}>🗑️</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={() => setShowImageViewer(false)}
                 style={styles.imageViewerCloseButton}
               >
                 <Text style={styles.imageViewerCloseButtonText}>✕</Text>
               </TouchableOpacity>
             </View>
           </View>
           
           <View style={styles.imageViewerBody}>
             {imageLoading ? (
               <View style={styles.imageLoadingContainer}>
                 <Text style={styles.imageLoadingText}>이미지를 불러오는 중...</Text>
               </View>
             ) : selectedImageFile ? (
                               <View style={styles.imageContainer}>
                  <Text style={styles.imageFileName}>{selectedImageFile.fileOrgNm}</Text>
                  <Text style={styles.imageFileInfo}>
                    생성일: {selectedImageFile.regDtm}
                  </Text>
                  <View style={styles.imageContainer}>
                                         <Image
                       source={{ uri: `${API_BASE_URL}/GROUP_IMG/${selectedImageFile.filePath.replace(/^C:\\IMGD\\GROUP_IMG\\/, '').replace(/\\/g, '/')}` }}
                       style={styles.imagePreview}
                       resizeMode="contain"
                       onError={() => {
                         // 이미지 로드 실패 시 플레이스홀더 표시
                         setImageLoading(false);
                       }}
                       onLoad={() => {
                         setImageLoading(false);
                       }}
                     />
                  </View>
                </View>
             ) : (
               <View style={styles.imageErrorContainer}>
                 <Text style={styles.imageErrorText}>이미지를 불러올 수 없습니다.</Text>
               </View>
             )}
           </View>
         </View>
       </View>
     </Modal>
   );

   // 파일 업로드 모달
   const renderUploadModal = () => (
     <Modal
       visible={showUploadModal}
       transparent={true}
       animationType="slide"
       onRequestClose={() => setShowUploadModal(false)}
     >
       <View style={styles.modalOverlay}>
         <View style={styles.modalContent}>
           <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>파일 업로드</Text>
             <TouchableOpacity 
               onPress={() => setShowUploadModal(false)}
               style={styles.modalCloseButton}
             >
               <Text style={styles.modalCloseButtonText}>✕</Text>
             </TouchableOpacity>
           </View>
           
           <View style={styles.modalBody}>
             {!selectedFile ? (
               <TouchableOpacity 
                 style={styles.selectFileButton}
                 onPress={handleSelectFile}
               >
                 <Text style={styles.selectFileButtonText}>📁 파일 선택</Text>
               </TouchableOpacity>
             ) : (
               <View style={styles.selectedFileInfo}>
                 <Text style={styles.selectedFileName}>선택된 파일: {selectedFile.fileName || '알 수 없는 파일'}</Text>
                 
                 {/* 업로드 중일 때 프로그래스 바 표시 */}
                 {uploadingFile ? (
                   <View style={styles.uploadProgressContainer}>
                     <Text style={styles.uploadingText}>파일을 업로드하는 중...</Text>
                     <View style={styles.progressBarContainer}>
                       <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
                     </View>
                     <Text style={styles.progressText}>{uploadProgress}%</Text>
                   </View>
                 ) : (
                   <View style={styles.fileActionButtons}>
                     <TouchableOpacity 
                       style={styles.changeFileButton}
                       onPress={handleSelectFile}
                     >
                       <Text style={styles.changeFileButtonText}>파일 변경</Text>
                     </TouchableOpacity>
                     
                     <TouchableOpacity 
                       style={styles.uploadConfirmButton}
                       onPress={handleUploadFile}
                       disabled={uploadingFile}
                     >
                       <Text style={styles.uploadConfirmButtonText}>
                         {uploadingFile ? '업로드 중...' : '업로드'}
                       </Text>
                     </TouchableOpacity>
                   </View>
                 )}
               </View>
             )}
           </View>
           
           <View style={styles.modalFooter}>
             <Text style={styles.modalFooterText}>
               • JPG, PNG 파일만 지원됩니다{'\n'}
               • 최대 파일 크기: 50MB
             </Text>
           </View>
         </View>
       </View>
     </Modal>
   );

  // 파일 및 디렉토리 화면
  const renderFilesView = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToGroups} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
                 <View style={styles.headerContent}>
           <View style={styles.titleRow}>
             <Text style={styles.title}>
               {directoryStack.length > 0 
                 ? `${selectedGroup?.groupNm} > ${directoryStack.map(item => item.name).join(' > ')}`
                 : selectedGroup?.groupNm
               }
             </Text>
             {directoryStack.length > 0 && (
               <TouchableOpacity onPress={handleBackToParent} style={styles.backToParentButton}>
                 <Text style={styles.backToParentButtonText}>↑ 상위 폴더</Text>
               </TouchableOpacity>
             )}
           </View>
         </View>
      </View>
      
      {/* 드래그 앤 드롭 영역 (웹 환경에서만 표시, 하위 폴더에서만 활성화) */}
      {Platform.OS === 'web' && directoryStack.length > 0 && (
        <div
          style={{
            backgroundColor: isDragOver ? '#dbeafe' : '#f8fafc',
            border: isDragOver ? '2px solid #3b82f6' : '2px dashed #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60px',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.2s ease-in-out',
            transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#64748b',
            textAlign: 'center',
            marginBottom: '4px',
          }}>
            {isDragOver ? '📁 파일을 여기에 놓으세요' : '📁 파일을 드래그하여 업로드하세요'}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#94a3b8',
            textAlign: 'center',
          }}>
            JPG, PNG 파일만 지원 (최대 50MB)
          </div>
        </div>
      )}
      
             {/* 폴더 생성 및 파일 업로드 섹션 - 상위 폴더가 있을 때만 표시 */}
       {directoryStack.length > 0 && (
         <View style={styles.createFolderSection}>
           <View style={styles.createFolderRow}>
             <View style={styles.leftSection}>
               <TouchableOpacity 
                 style={[
                   styles.createFolderButton,
                   showCreateFolder ? styles.createFolderButtonActive : styles.createFolderButtonInactive
                 ]}
                 onPress={showCreateFolder ? handleCreateFolder : toggleCreateFolder}
                 disabled={creatingFolder}
               >
                 <Text style={[
                   styles.createFolderButtonText,
                   showCreateFolder ? styles.createFolderButtonTextActive : styles.createFolderButtonTextInactive
                 ]}>
                   {creatingFolder ? '생성 중...' : (showCreateFolder ? '생성' : '폴더 생성')}
                 </Text>
               </TouchableOpacity>
               
               {showCreateFolder && (
                 <View style={styles.folderNameInputContainer}>
                   <TextInput
                     style={[
                       styles.folderNameInput,
                       !folderValidation.isValid && styles.folderNameInputError
                     ]}
                     placeholder="폴더 이름을 입력하세요"
                     value={newFolderName}
                     onChangeText={handleFolderNameChange}
                     autoFocus={true}
                     onSubmitEditing={handleCreateFolder}
                   />
                   
                   {/* 유효성 검사 에러 메시지 */}
                   {!folderValidation.isValid && folderValidation.errorMessage && (
                     <View style={styles.validationErrorContainer}>
                       <Text style={styles.validationErrorText}>
                         {folderValidation.errorMessage}
                       </Text>
                       
                       {/* 정리된 이름 제안 */}
                       {folderValidation.sanitizedSuggestion && (
                         <View style={styles.sanitizedSuggestionContainer}>
                           <Text style={styles.sanitizedSuggestionText}>
                             제안: {folderValidation.sanitizedSuggestion}
                           </Text>
                           <TouchableOpacity 
                             style={styles.applySuggestionButton}
                             onPress={handleApplySanitizedName}
                           >
                             <Text style={styles.applySuggestionButtonText}>적용</Text>
                           </TouchableOpacity>
                         </View>
                       )}
                     </View>
                   )}
                 </View>
               )}
             </View>
             
             {/* 파일 업로드 버튼 (우측) */}
             <TouchableOpacity 
               style={styles.uploadButton}
               onPress={() => setShowUploadModal(true)}
             >
               <Text style={styles.uploadButtonText}>📁 파일 업로드</Text>
             </TouchableOpacity>
           </View>
         </View>
       )}
      
      {loadingFiles ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>파일 목록을 불러오는 중...</Text>
        </View>
      ) : filesAndDirectories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>파일이나 디렉토리가 없습니다</Text>
        </View>
      ) : (
        <View style={styles.splitContainer}>
          {/* 폴더 목록 (좌측) - 폴더가 있을 때만 표시 */}
          {filesAndDirectories.filter(item => item.type === 'DIR').length > 0 && (
            <View style={[
              styles.folderSection,
              filesAndDirectories.filter(item => item.type === 'FILE').length === 0 && styles.fullWidth
            ]}>
              <Text style={styles.sectionTitle}>📁 폴더</Text>
              <ScrollView style={styles.sectionScrollView}>
                {filesAndDirectories.filter(item => item.type === 'DIR').map((item, idx) => (
                  <View key={`dir-${idx}`} style={styles.fileCard}>
                    <View style={styles.fileCardContent}>
                      <TouchableOpacity 
                        style={styles.fileClickableArea}
                        onPress={() => handleDirectoryClick(item)}
                        disabled={false}
                      >
                        <View style={styles.fileHeader}>
                          <View style={styles.directoryIcon}>
                            <Text style={styles.fileIconText}>📁</Text>
                          </View>
                          <View style={styles.fileMainInfo}>
                            <View style={styles.fileNameRow}>
                              <Text style={styles.fileName}>{item.fileNm}</Text>
                            </View>
                            <Text style={styles.fileType}>디렉토리</Text>
                          </View>
                        </View>
                        <View style={styles.fileDetails}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>생성일</Text>
                            <Text style={styles.detailValue}>{item.regDtm}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                      {/* 폴더 삭제 버튼 */}
                      <View style={styles.deleteButtonContainer}>
                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => handleDeleteFolder(item)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 파일 목록 (우측) - 파일이 있을 때만 표시 */}
          {filesAndDirectories.filter(item => item.type === 'FILE').length > 0 && (
            <View style={[
              styles.fileSection,
              filesAndDirectories.filter(item => item.type === 'DIR').length === 0 && styles.fullWidth
            ]}>
              <Text style={styles.sectionTitle}>📄 파일</Text>
              <ScrollView style={styles.sectionScrollView}>
                {filesAndDirectories.filter(item => item.type === 'FILE').map((item, idx) => (
                  <View key={`file-${idx}`} style={styles.fileCard}>
                    <View style={styles.fileCardContent}>
                      <TouchableOpacity 
                        style={styles.fileClickableArea}
                        onPress={() => handleFileClick(item)}
                        disabled={false}
                      >
                        <View style={styles.fileHeader}>
                          <View style={styles.fileIcon}>
                            <Image
                              source={{ uri: `${API_BASE_URL}/GROUP_IMG/${item.filePath.replace(/^C:\\IMGD\\GROUP_IMG\\/, '').replace(/\\/g, '/')}` }}
                              style={styles.fileThumbnail}
                              resizeMode="cover"
                              onError={() => {
                                // 이미지 로드 실패 시 기본 아이콘 표시
                              }}
                            />
                          </View>
                          <View style={styles.fileMainInfo}>
                            <View style={styles.fileNameRow}>
                              <Text style={styles.fileName}>{item.fileOrgNm}</Text>
                            </View>
                            <Text style={styles.fileType}>이미지 파일</Text>
                          </View>
                        </View>
                        <View style={styles.fileDetails}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>생성일</Text>
                            <Text style={styles.detailValue}>{item.regDtm}</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </>
  );

     return (
     <View style={styles.container}>
       {viewMode === 'groups' ? renderGroupsView() : renderFilesView()}
       {renderUploadModal()}
       {renderImageViewerModal()}
       {/* 전역 프로그래스바 - 모달 위에 표시 */}
       {uploadingFile && (
         <View style={styles.globalProgressOverlay}>
           <View style={styles.globalProgressContainer}>
             <Text style={styles.globalProgressText}>파일을 업로드하는 중...</Text>
             <View style={styles.globalProgressBarContainer}>
               <View style={[styles.globalProgressBar, { width: `${uploadProgress}%` }]} />
             </View>
             <Text style={styles.globalProgressPercentage}>{uploadProgress}%</Text>
           </View>
         </View>
       )}
     </View>
   );
}

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Image, Pressable } from 'react-native';
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
  const [currentParentId, setCurrentParentId] = useState<number>(2); // 현재 디렉토리의 parentId
  const [directoryStack, setDirectoryStack] = useState<Array<{ id: number; name: string }>>([]); // 디렉토리 탐색 경로
  const [currentDirectoryName, setCurrentDirectoryName] = useState<string>(''); // 현재 디렉토리의 이름
  
  // 파일 업로드 관련 상태
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  
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
      Alert.alert('오류', '파일 및 디렉토리 목록을 불러올 수 없습니다.');
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

  // 폴더 생성 모드 토글
  const toggleCreateFolder = () => {
    if (showCreateFolder) {
      // 폴더 생성 모드에서 나가기
      setShowCreateFolder(false);
      setNewFolderName('');
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
        Alert.alert('오류', '파일 정보를 불러올 수 없습니다.');
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
      Alert.alert(
        '파일 삭제',
        `"${file.fileOrgNm}" 파일을 삭제하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel'
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await FileAPI.deleteFile(file.fileId!);
                
                // ApiResponse 구조 확인
                if (response.data.success) {
                  Alert.alert('성공', '파일이 삭제되었습니다.');
                  
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
                  Alert.alert('오류', errorMessage);
                }
              } catch (error: any) {
                console.error('파일 삭제 실패:', error);
                
                // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
                if (error.response && error.response.data) {
                  const responseData = error.response.data;
                  
                  // ApiResponse 구조인 경우
                  if (responseData.error && responseData.error.message) {
                    Alert.alert('오류', responseData.error.message);
                  } else if (responseData.message) {
                    Alert.alert('오류', responseData.message);
                  } else {
                    Alert.alert('오류', '파일 삭제에 실패했습니다.');
                  }
                } else {
                  // 네트워크 에러나 기타 에러
                  Alert.alert('오류', '파일 삭제에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
                }
              }
            }
          }
        ]
      );
    }
  };

  // 파일 선택
  const handleSelectFile = async () => {
    try {
      // 이미지 선택 권한 요청
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
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
               Alert.alert('파일 크기 초과', '파일 크기는 50MB를 초과할 수 없습니다.');
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
           Alert.alert('지원하지 않는 파일 형식', 'JPG, PNG 파일만 업로드할 수 있습니다.');
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
      Alert.alert('오류', '파일을 선택할 수 없습니다.');
    }
  };

  // 파일 업로드
  const handleUploadFile = async () => {
    if (!selectedFile || !selectedGroup?.groupId || !subject) {
      Alert.alert('오류', '파일을 선택해주세요.');
      return;
    }

    setUploadingFile(true);
    try {
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

      // ApiResponse 구조 확인
      if (response.data.success) {
        Alert.alert('성공', '파일이 업로드되었습니다.');
        // 파일 목록 새로고침
        await loadFilesAndDirectories(selectedGroup.groupId, currentParentId);
        // 업로드 모달 닫기
        setShowUploadModal(false);
        setSelectedFile(null);
      } else {
        // API에서 에러 응답을 받은 경우
        const errorMessage = response.data.error?.message || '파일 업로드에 실패했습니다.';
        Alert.alert('오류', errorMessage);
      }
    } catch (error: any) {
      console.error('파일 업로드 실패:', error);
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          Alert.alert('오류', responseData.error.message);
        } else if (responseData.message) {
          Alert.alert('오류', responseData.message);
        } else {
          Alert.alert('오류', '파일 업로드에 실패했습니다.');
        }
      } else {
        // 네트워크 에러나 기타 에러
        Alert.alert('오류', '파일 업로드에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
      }
    } finally {
      setUploadingFile(false);
    }
  };

  // 폴더 생성
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedGroup?.groupId || !subject) {
      Alert.alert('오류', '폴더 이름을 입력해주세요.');
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
        Alert.alert('성공', '폴더가 생성되었습니다.');
        // 폴더 목록 새로고침 - 현재 위치한 디렉토리에서 새로고침
        await loadFilesAndDirectories(selectedGroup.groupId, currentParentId);
        // 폴더 생성 모드 완전 종료
        setShowCreateFolder(false);
        setNewFolderName('');
        setCreatingFolder(false);
      } else {
        // API에서 에러 응답을 받은 경우
        const errorMessage = response.data.error?.message || '폴더 생성에 실패했습니다.';
        Alert.alert('오류', errorMessage);
        setCreatingFolder(false);
      }
    } catch (error: any) {
      console.error('폴더 생성 실패:', error);
      
      // axios 에러인 경우 백엔드 응답에서 에러 메시지 추출
      if (error.response && error.response.data) {
        const responseData = error.response.data;
        
        // ApiResponse 구조인 경우
        if (responseData.error && responseData.error.message) {
          Alert.alert('오류', responseData.error.message);
        } else if (responseData.message) {
          Alert.alert('오류', responseData.message);
        } else {
          Alert.alert('오류', '폴더 생성에 실패했습니다.');
        }
      } else {
        // 네트워크 에러나 기타 에러
        Alert.alert('오류', '폴더 생성에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
      }
      setCreatingFolder(false);
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
             <TouchableOpacity 
               onPress={() => setShowImageViewer(false)}
               style={styles.imageViewerCloseButton}
             >
               <Text style={styles.imageViewerCloseButtonText}>✕</Text>
             </TouchableOpacity>
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
           <Text style={styles.title}>
             {directoryStack.length > 0 
               ? `${selectedGroup?.groupNm} > ${directoryStack.map(item => item.name).join(' > ')}`
               : selectedGroup?.groupNm
             }
           </Text>
           <Text style={styles.description}>파일 및 디렉토리 목록</Text>
           {directoryStack.length > 0 && (
             <TouchableOpacity onPress={handleBackToParent} style={styles.backToParentButton}>
               <Text style={styles.backToParentButtonText}>↑ 상위 폴더</Text>
             </TouchableOpacity>
           )}
         </View>
      </View>
      
             {/* 폴더 생성 및 파일 업로드 섹션 - 상위 폴더가 있을 때만 표시 */}
       {directoryStack.length > 0 && (
         <View style={styles.createFolderSection}>
           <View style={styles.createFolderRow}>
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
                   style={styles.folderNameInput}
                   placeholder="폴더 이름을 입력하세요"
                   value={newFolderName}
                   onChangeText={setNewFolderName}
                   autoFocus={true}
                   onSubmitEditing={handleCreateFolder}
                 />
               </View>
             )}
           </View>
           
           {/* 파일 업로드 버튼 */}
           <View style={styles.uploadSection}>
             <TouchableOpacity 
               style={styles.uploadButton}
               onPress={() => setShowUploadModal(true)}
             >
               <Text style={styles.uploadButtonText}>📁 파일 업로드</Text>
             </TouchableOpacity>
           </View>
         </View>
       )}
      
      <ScrollView style={styles.scrollView}>
        {loadingFiles ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>파일 목록을 불러오는 중...</Text>
          </View>
        ) : filesAndDirectories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>파일이나 디렉토리가 없습니다</Text>
          </View>
        ) : (
          filesAndDirectories.map((item, idx) => (
            <View key={idx} style={styles.fileCard}>
              <View style={styles.fileCardContent}>
                <TouchableOpacity 
                  style={styles.fileClickableArea}
                  onPress={() => item.type === 'DIR' ? handleDirectoryClick(item) : handleFileClick(item)}
                  disabled={false}
                >
                  <View style={styles.fileHeader}>
                    {item.type === 'DIR' ? (
                      <View style={styles.directoryIcon}>
                        <Text style={styles.fileIconText}>📁</Text>
                      </View>
                    ) : (
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
                    )}
                    <View style={styles.fileMainInfo}>
                      <View style={styles.fileNameRow}>
                        <Text style={styles.fileName}>
                          {item.type === 'DIR' ? item.fileNm : item.fileOrgNm}
                        </Text>
                      </View>
                      <Text style={styles.fileType}>
                        {item.type === 'DIR' ? '디렉토리 (탭하여 열기)' : '이미지 파일'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.fileDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>생성일</Text>
                      <Text style={styles.detailValue}>{item.regDtm}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {item.type === 'FILE' && (
                  <View style={styles.deleteButtonContainer}>
                    <Pressable 
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFile(item)}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );

     return (
     <View style={styles.container}>
       {viewMode === 'groups' ? renderGroupsView() : renderFilesView()}
       {renderUploadModal()}
       {renderImageViewerModal()}
     </View>
   );
}

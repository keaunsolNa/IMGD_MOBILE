import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import GroupScreen from '../screens/group/GroupScreen';
import FileScreen from '../screens/file/FileScreen';
import MakeGroupScreen from '../screens/group/MakeGroupScreen';

import GroupUserScreen from '../screens/group/GroupUserScreen';
import MyPageScreen from '../screens/myPage/MyPageScreen';
import FriendScreen from '../screens/friend/FriendScreen';
import CommunityScreen from '../screens/community/CommunityScreen';
import CreateArticleScreen from '../screens/community/CreateArticleScreen';
import ArticleDetailScreen from '../screens/community/ArticleDetailScreen';
import HeaderButtons from '../components/HeaderButtons';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const isAuthenticated = useSelector((s: RootState) => !!s.auth.accessToken);
    return (
        <NavigationContainer>
            <Stack.Navigator 
                screenOptions={{ 
                    headerShown: true,
                    headerRight: () => isAuthenticated ? <HeaderButtons /> : null
                }}
            >
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="Groups" component={GroupScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="MakeGroup" component={MakeGroupScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="GroupUser" component={GroupUserScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="File" component={FileScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="MyPage" component={MyPageScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="Friend" component={FriendScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'IMGD' }} />
                        <Stack.Screen name="CreateArticle" component={CreateArticleScreen} options={{ title: '글쓰기' }} />
                        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: '게시글' }} />
                    </>
                ) : (
                  <>
                    <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'IMGD' }} />
                  </>

          )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
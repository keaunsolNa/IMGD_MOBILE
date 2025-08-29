import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import GroupScreen from '../screens/group/GroupScreen';
import FileScreen from '../screens/FileScreen';
import MakeGroupScreen from '../screens/group/MakeGroupScreen';

import GroupUserScreen from '../screens/group/GroupUserScreen';
import MyPageScreen from '../screens/MyPageScreen';
import FriendScreen from '../screens/FriendScreen';
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
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import GroupScreen from '../screens/group/GroupScreen';
import UploadScreen from '../screens/UploadScreen';
import MakeGroupScreen from '../screens/group/MakeGroupScreen';
import MakeGroupRootFolderScreen from '../screens/group/MakeGroupRootFolderScreen';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const isAuthenticated = useSelector((s: RootState) => !!s.auth.accessToken);
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Groups" component={GroupScreen} />
                        <Stack.Screen name="MakeGroup" component={MakeGroupScreen} />
                        <Stack.Screen name="MakeGroupRootFolder" component={MakeGroupRootFolderScreen} options={{ title: 'Make Group Root Folder' }} />
                        <Stack.Screen name="Upload" component={UploadScreen} />
                    </>
                ) : (
                  <>
                    <Stack.Screen name="Login" component={LoginScreen} />
                  </>

          )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
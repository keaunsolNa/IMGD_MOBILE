import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import GroupScreen from '../screens/GroupScreen';
import UploadScreen from '../screens/UploadScreen';
import { useAuth } from '@/hooks/useAuth';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { isReady, isAuthenticated, boot } = useAuth();
    useEffect(() => { boot(); }, []);
    if (!isReady) return null; // Splash placeholder
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: true }}>
                {isAuthenticated ? (
                    <>
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen name="Groups" component={GroupScreen} />
                        <Stack.Screen name="Upload" component={UploadScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
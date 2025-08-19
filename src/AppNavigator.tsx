// AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen  from '@/screens/LoginScreen';
import HomeScreen   from '@/screens/HomeScreen';
import GroupScreen  from '@/screens/GroupScreen';
import UploadScreen from '@/screens/UploadScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Groups" component={GroupScreen} />
      <Tab.Screen name="Upload" component={UploadScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} /> {/* 탭 컨테이너를 루트에 등록 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});

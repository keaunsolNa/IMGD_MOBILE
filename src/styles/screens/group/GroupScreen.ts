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
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  masterName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  regDtm: {
    fontSize: 14,
    color: '#666',
  },
  expandIcon: {
    paddingLeft: 16,
  },
  expandIconText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
  userSection: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  userSectionHeader: {
    marginBottom: 12,
  },
  userSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  userItem: {
    backgroundColor: 'white',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  joinDate: {
    fontSize: 12,
    color: '#666',
  },
  noUsersText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 32,
  },
  spacing: {
    height: 8,
  },
});

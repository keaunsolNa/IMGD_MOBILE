import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 12,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: 'white',
  },
  groupNameInputError: {
    borderColor: '#ef4444',
    borderWidth: 2,
  },
  validationErrorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  validationErrorText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 8,
  },
  sanitizedSuggestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  sanitizedSuggestionText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '500',
    flex: 1,
  },
  applySuggestionButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  applySuggestionButtonText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 12,
  },
});

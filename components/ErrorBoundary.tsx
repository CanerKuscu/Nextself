import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Observability } from '../utils/observability';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../hooks/useTranslation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  theme?: any;
  t?: any;
  isTurkish?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    try {
      if (Observability.captureException) {
        Observability.captureException(error);
      }
    } catch (e) {
      console.error('Failed to report to Observability', e);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI styling from props or light mode
      const isDark = this.props.theme?.isDark || false;
      const colors = this.props.theme?.colors || {
        background: '#F9FAFB',
        text: '#1F2937',
        textSecondary: '#6B7280',
        error: '#EF4444',
        secondary: '#4F46E5',
        secondaryDark: '#4F46E5',
      };

      const t = this.props.t || ((k: string) => k);
      const isTurkish = this.props.isTurkish !== undefined ? this.props.isTurkish : true;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <Ionicons name="warning-outline" size={64} color={colors.error} />
            <Text style={[styles.title, { color: colors.text }]}>
              {isTurkish ? 'Eyvah! Bir şeyler ters gitti' : 'Oops! Something went wrong'}
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {isTurkish
                ? 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.'
                : 'We encountered an unexpected error. Please try again.'}
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={[styles.errorDetails, { color: colors.error }]}>
                {this.state.error.toString()}
              </Text>
            )}
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.secondaryDark || colors.secondary }]} onPress={this.handleRetry}>
              <Ionicons name="refresh-outline" size={20} color={isDark ? colors.text : colors.textInverse} />
              <Text style={[styles.retryText, { color: isDark ? colors.text : colors.textInverse }]}>{isTurkish ? 'Tekrar Dene' : 'Try Again'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper to inject hooks into the class component
export default function ErrorBoundaryWithHooks(props: Omit<Props, 'theme' | 't' | 'isTurkish'>) {
  const theme = useTheme();
  const { t, isTurkish } = useTranslation();

  return (
    <ErrorBoundary
      {...props}
      theme={theme}
      t={t}
      isTurkish={isTurkish}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'monospace',
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});


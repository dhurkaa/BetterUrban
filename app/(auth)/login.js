import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Action Required", "Please fill in all fields to continue.");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    
    // Simulate login process
    Alert.alert("Welcome Back!", "Logging you in...", [
      {
        text: "OK",
        onPress: async () => {
          await AsyncStorage.setItem('userToken', 'user_logged_in');
          router.replace('/');
        }
      }
    ]);
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <View style={styles.gradientOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.keyboardView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                  <View style={styles.logoContainer}>
                    <View style={styles.logoIconWrapper}>
                      <MaterialIcons name="location-city" size={42} color="#00d4ff" />
                    </View>
                    <View style={styles.logoTextContainer}>
                      <Text style={styles.logoText}>UrbanIssue</Text>
                      <Text style={styles.logoSubText}>Reporter</Text>
                    </View>
                  </View>
                  <Text style={styles.welcomeText}>Welcome Back, Urban Guardian</Text>
                  <Text style={styles.tagline}>Report. Resolve. Revitalize.</Text>
                </View>

                {/* Login Form Card */}
                <View style={styles.formCard}>
                  <View style={styles.formCardInner}>
                    <Text style={styles.formTitle}>Secure Login</Text>
                    
                    {/* Email Input */}
                    <View style={[
                      styles.inputContainer,
                      isFocusedEmail && styles.inputContainerFocused
                    ]}>
                      <MaterialIcons 
                        name="email" 
                        size={22} 
                        color={isFocusedEmail ? '#007AFF' : '#6B7280'} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setIsFocusedEmail(true)}
                        onBlur={() => setIsFocusedEmail(false)}
                      />
                    </View>

                    {/* Password Input */}
                    <View style={[
                      styles.inputContainer,
                      isFocusedPassword && styles.inputContainerFocused
                    ]}>
                      <MaterialIcons 
                        name="lock" 
                        size={22} 
                        color={isFocusedPassword ? '#007AFF' : '#6B7280'} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setIsFocusedPassword(true)}
                        onBlur={() => setIsFocusedPassword(false)}
                      />
                      <TouchableOpacity style={styles.visibilityIcon}>
                        <MaterialIcons name="visibility-off" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotPassword}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity 
                      style={styles.loginButton} 
                      onPress={handleLogin}
                      activeOpacity={0.9}
                    >
                      <View style={styles.buttonGradient}>
                        <MaterialIcons name="login" size={22} color="#FFFFFF" />
                        <Text style={styles.loginButtonText}>Login to Dashboard</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>OR</Text>
                      <View style={styles.divider} />
                    </View>

                    {/* Quick Login Options */}
                    <View style={styles.socialLoginContainer}>
                      <TouchableOpacity style={styles.socialButton}>
                        <FontAwesome5 name="fingerprint" size={20} color="#007AFF" />
                        <Text style={styles.socialButtonText}>Use Biometrics</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.socialButton}>
                        <MaterialIcons name="smartphone" size={22} color="#007AFF" />
                        <Text style={styles.socialButtonText}>Quick PIN</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Sign Up Section */}
                    <View style={styles.signUpContainer}>
                      <Text style={styles.signUpText}>New to Urban Guardian?</Text>
                      <TouchableOpacity 
                        style={styles.signUpButton}
                        onPress={handleSignUp}
                      >
                        <View style={styles.signUpButtonInner}>
                          <Text style={styles.signUpButtonText}>Create Account</Text>
                          <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Secured with AES-256 encryption • Your data is protected
                  </Text>
                  <View style={styles.securityBadge}>
                    <MaterialIcons name="security" size={16} color="#00FF88" />
                    <Text style={styles.securityText}>Protected Login</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 30, 60, 0.9)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIconWrapper: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 12,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  logoTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoSubText: {
    fontSize: 32,
    fontWeight: '300',
    color: '#00d4ff',
    letterSpacing: -0.5,
    marginLeft: 4,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#A0C8FF',
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  formCardInner: {
    padding: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  formTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 18,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    height: 58,
  },
  inputContainerFocused: {
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  visibilityIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 0.48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  socialButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  signUpContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  signUpText: {
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 16,
    fontWeight: '500',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  securityText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
});
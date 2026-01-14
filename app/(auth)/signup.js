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

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFocusedName, setIsFocusedName] = useState(false);
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedConfirmPassword, setIsFocusedConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Action Required", "Please fill in all fields to continue.");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    
    // Password validation
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }
    
    // Confirm password
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please try again.");
      return;
    }
    
    // Simulate signup process
    Alert.alert(
      "Account Created!",
      "Your Urban Guardian account has been successfully created.",
      [
        {
          text: "Continue",
          onPress: async () => {
            // Save user data (in a real app, this would go to your backend)
            await AsyncStorage.setItem('userToken', 'user_logged_in');
            await AsyncStorage.setItem('userName', name);
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000' }}
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
                      <MaterialIcons name="person-add" size={42} color="#00d4ff" />
                    </View>
                    <View style={styles.logoTextContainer}>
                      <Text style={styles.logoText}>Join</Text>
                      <Text style={styles.logoSubText}>UrbanIssue</Text>
                    </View>
                  </View>
                  <Text style={styles.welcomeText}>Become an Urban Guardian</Text>
                  <Text style={styles.tagline}>Report. Monitor. Make a Difference.</Text>
                </View>

                {/* SignUp Form Card */}
                <View style={styles.formCard}>
                  <View style={styles.formCardInner}>
                    <Text style={styles.formTitle}>Create Account</Text>
                    
                    {/* Full Name Input */}
                    <View style={[
                      styles.inputContainer,
                      isFocusedName && styles.inputContainerFocused
                    ]}>
                      <MaterialIcons 
                        name="person" 
                        size={22} 
                        color={isFocusedName ? '#007AFF' : '#6B7280'} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Full Name"
                        placeholderTextColor="#9CA3AF"
                        autoCapitalize="words"
                        autoCorrect={false}
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setIsFocusedName(true)}
                        onBlur={() => setIsFocusedName(false)}
                      />
                    </View>

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
                        placeholder="Password (min. 6 characters)"
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

                    {/* Confirm Password Input */}
                    <View style={[
                      styles.inputContainer,
                      isFocusedConfirmPassword && styles.inputContainerFocused
                    ]}>
                      <MaterialIcons 
                        name="lock-outline" 
                        size={22} 
                        color={isFocusedConfirmPassword ? '#007AFF' : '#6B7280'} 
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onFocus={() => setIsFocusedConfirmPassword(true)}
                        onBlur={() => setIsFocusedConfirmPassword(false)}
                      />
                      <TouchableOpacity style={styles.visibilityIcon}>
                        <MaterialIcons name="visibility-off" size={20} color="#6B7280" />
                      </TouchableOpacity>
                    </View>

                    {/* Password Requirements */}
                    <View style={styles.passwordRequirements}>
                      <Text style={styles.requirementsTitle}>Password must contain:</Text>
                      <View style={styles.requirementItem}>
                        <MaterialIcons 
                          name={password.length >= 6 ? "check-circle" : "radio-button-unchecked"} 
                          size={16} 
                          color={password.length >= 6 ? '#10B981' : '#9CA3AF'} 
                        />
                        <Text style={[
                          styles.requirementText,
                          password.length >= 6 && styles.requirementTextMet
                        ]}>At least 6 characters</Text>
                      </View>
                      <View style={styles.requirementItem}>
                        <MaterialIcons 
                          name={/\d/.test(password) ? "check-circle" : "radio-button-unchecked"} 
                          size={16} 
                          color={/\d/.test(password) ? '#10B981' : '#9CA3AF'} 
                        />
                        <Text style={[
                          styles.requirementText,
                          /\d/.test(password) && styles.requirementTextMet
                        ]}>At least one number</Text>
                      </View>
                    </View>

                    {/* Terms and Conditions */}
                    <View style={styles.termsContainer}>
                      <MaterialIcons name="info" size={18} color="#6B7280" />
                      <Text style={styles.termsText}>
                        By signing up, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </Text>
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity 
                      style={[
                        styles.signUpButton,
                        (!name || !email || !password || !confirmPassword) && styles.signUpButtonDisabled
                      ]} 
                      onPress={handleSignUp}
                      activeOpacity={0.9}
                      disabled={!name || !email || !password || !confirmPassword}
                    >
                      <View style={styles.buttonGradient}>
                        <MaterialIcons name="how-to-reg" size={22} color="#FFFFFF" />
                        <Text style={styles.signUpButtonText}>Create Urban Guardian Account</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
                      <View style={styles.divider} />
                    </View>

                    {/* Social Sign Up Options */}
                    <View style={styles.socialLoginContainer}>
                      <TouchableOpacity style={styles.socialButton}>
                        <FontAwesome5 name="google" size={20} color="#DB4437" />
                        <Text style={[styles.socialButtonText, { color: '#DB4437' }]}>Google</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.socialButton}>
                        <FontAwesome5 name="apple" size={22} color="#000000" />
                        <Text style={[styles.socialButtonText, { color: '#000000' }]}>Apple ID</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Login Section */}
                    <View style={styles.loginContainer}>
                      <Text style={styles.loginText}>Already an Urban Guardian?</Text>
                      <TouchableOpacity 
                        style={styles.loginButton}
                        onPress={handleLogin}
                      >
                        <View style={styles.loginButtonInner}>
                          <Text style={styles.loginButtonText}>Sign In Instead</Text>
                          <MaterialIcons name="arrow-forward" size={18} color="#007AFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Your data is encrypted and protected • No spam, ever
                  </Text>
                  <View style={styles.securityBadge}>
                    <MaterialIcons name="verified-user" size={16} color="#00FF88" />
                    <Text style={styles.securityText}>Verified Signup</Text>
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
    backgroundColor: 'rgba(0, 40, 85, 0.92)',
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
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  logoSubText: {
    fontSize: 24,
    fontWeight: '300',
    color: '#00d4ff',
    letterSpacing: -0.5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    color: '#A0C8FF',
    letterSpacing: 1.2,
    fontWeight: '500',
    textAlign: 'center',
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
  passwordRequirements: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requirementText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 8,
  },
  requirementTextMet: {
    color: '#10B981',
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#0369A1',
    marginLeft: 8,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    backgroundColor: '#10B981',
  },
  signUpButtonText: {
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
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 0.48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 16,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  loginButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    color: '#007AFF',
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
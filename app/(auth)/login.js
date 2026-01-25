import React, { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ImageBackground,
  Dimensions,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+383'); // Default prefix
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);
  const [isFocusedPhone, setIsFocusedPhone] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const router = useRouter();

  // Refs për input fields
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const passwordRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Funksion për të marrë lokacionin nga IP
  const getLocationFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      setUserLocation({
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        ip: data.ip
      });

      // Ruaj lokacionin në AsyncStorage
      await AsyncStorage.setItem('userLocation', JSON.stringify({
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city,
        country: data.country_name,
        ip: data.ip,
        source: 'ip_api'
      }));

    } catch (error) {
      console.error('Error fetching location from IP:', error);
      
      // Fallback në lokacionin e pajisjes
      getDeviceLocation();
    }
  };

  // Funksion për të marrë lokacionin nga pajisja
  const getDeviceLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for better service.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      // Get reverse geocoding for address
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      setUserLocation({
        latitude: location.coords.latitude,
        address: geocode[0] ? `${geocode[0].city}, ${geocode[0].country}` : 'Unknown location',
        source: 'device_gps'
      });

      await AsyncStorage.setItem('userLocation', JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: geocode[0] ? {
          city: geocode[0].city,
          country: geocode[0].country,
          street: geocode[0].street
        } : null,
        source: 'device_gps'
      }));

    } catch (error) {
      console.error('Error getting device location:', error);
    }
  };

  // Validimi i numrit të telefonit Kosovar
  const validateKosovoPhoneNumber = (phoneNumber) => {
    // Format pranues: +383 XX XXX XXX
    const kosovoPhoneRegex = /^\+383\s?(4[4-9]|[6-9]\d)\s?\d{3}\s?\d{3}$/;
    
    // Heq të gjitha hapësirat për validim
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    
    // Kontrolloj nëse fillon me +383
    if (!cleanNumber.startsWith('+383')) {
      return { isValid: false, message: 'Phone number must start with +383' };
    }

    // Kontrolloj gjatësinë totale (12 karaktere: +383 + 8 shifra)
    if (cleanNumber.length !== 12) {
      return { isValid: false, message: 'Invalid phone number length' };
    }

    // Kontrolloj nëse numri pas +383 është valid
    const operatorCode = cleanNumber.substring(4, 6);
    const validOperators = ['44', '45', '46', '47', '48', '49', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69'];
    
    if (!validOperators.includes(operatorCode)) {
      return { isValid: false, message: 'Invalid operator code' };
    }

    return { isValid: true, formattedNumber: formatPhoneNumber(cleanNumber) };
  };

  // Formatimi i numrit të telefonit
  const formatPhoneNumber = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\s/g, '');
    if (cleanNumber.startsWith('+383')) {
      const rest = cleanNumber.substring(4);
      return `+383 ${rest.substring(0, 2)} ${rest.substring(2, 5)} ${rest.substring(5)}`;
    }
    return phoneNumber;
  };

  // Handler për ndryshimin e numrit të telefonit
  const handlePhoneChange = (text) => {
    // Nuk lejohet të fshihet prefix-i +383
    if (!text.startsWith('+383')) {
      setPhone('+383');
      return;
    }

    // Heq të gjitha karakteret jo-numerike përveç +
    let cleanText = text.replace(/[^\d+]/g, '');
    
    // Limit maksimal i karaktereve
    if (cleanText.length > 12) {
      cleanText = cleanText.substring(0, 12);
    }

    // Shto formatim automatik
    if (cleanText.length > 4) {
      const prefix = cleanText.substring(0, 4);
      const rest = cleanText.substring(4);
      
      let formatted = prefix;
      if (rest.length > 0) formatted += ` ${rest.substring(0, 2)}`;
      if (rest.length > 2) formatted += ` ${rest.substring(2, 5)}`;
      if (rest.length > 5) formatted += ` ${rest.substring(5, 8)}`;
      
      setPhone(formatted);
    } else {
      setPhone(cleanText);
    }
  };

  // Marr lokacionin kur komponenti mountohet
  useEffect(() => {
    getLocationFromIP();
    
    // Shiko nëse ka lokacion të ruajtur më parë
    const checkStoredLocation = async () => {
      const storedLocation = await AsyncStorage.getItem('userLocation');
      if (storedLocation) setUserLocation(JSON.parse(storedLocation));
    };
    
    checkStoredLocation();
  }, []);

  const handleLogin = async () => {
    if (!email || !password || !phone) {
      Alert.alert("Action Required", "Please fill in all fields to continue.");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    
    // Phone number validation
    const phoneValidation = validateKosovoPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      Alert.alert("Invalid Phone Number", phoneValidation.message);
      return;
    }
    
    // Kontrollo nëse kemi lokacion
    if (!userLocation) {
      Alert.alert(
        "Location Service", 
        "We couldn't detect your location. Some features might be limited.",
        [{ text: "Continue Anyway" }]
      );
    }
    
    // Simulate login process
    Alert.alert(
      "Welcome Back!", 
      `Logging you in...\nLocation: ${userLocation?.city || 'Detecting...'}`,
      [
        {
          text: "OK",
          onPress: async () => {
            // Ruaj të dhënat e përdoruesit
            await AsyncStorage.setItem('userToken', 'user_logged_in');
            await AsyncStorage.setItem('userPhone', phoneValidation.formattedNumber);
            
            if (userLocation) {
              await AsyncStorage.setItem('lastKnownLocation', JSON.stringify(userLocation));
            }
            
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleSignUp = () => {
    router.push('/signup');
  };

  // Funksion për të ri-marrë lokacionin
  const handleRefreshLocation = async () => {
    Alert.alert(
      "Refresh Location",
      "Would you like to use device GPS for more accurate location?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Use GPS", 
          onPress: () => {
            getDeviceLocation();
            Alert.alert("Location Updated", "Using device GPS location.");
          }
        },
        { 
          text: "Use IP", 
          onPress: () => {
            getLocationFromIP();
            Alert.alert("Location Updated", "Using IP-based location.");
          }
        }
      ]
    );
  };

  // Funksion për të fokusuar në field-in tjetër
  const focusNextField = (nextFieldRef) => {
    if (nextFieldRef.current) nextFieldRef.current.focus();
  };

  return (
    <View style={styles.container}>
      {/* ✅ Fix iOS white header: transparent status bar */}
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" translucent backgroundColor="transparent" />

      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <View style={styles.gradientOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
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
                  
                  {/* Location Display */}
                  {userLocation && (
                    <TouchableOpacity 
                      style={styles.locationBadge}
                      onPress={handleRefreshLocation}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="location-on" size={16} color="#00FF88" />
                      <Text style={styles.locationText}>
                        {userLocation.city || 'Location'} • {userLocation.ip ? 'IP-based' : 'GPS'}
                      </Text>
                      <MaterialIcons name="refresh" size={14} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Login Form Card */}
                <View style={styles.formCard}>
                  <View style={styles.formCardInner}>
                    <Text style={styles.formTitle}>Secure Login</Text>
                    
                    {/* Email Input */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        isFocusedEmail && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => emailRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="email" 
                          size={22} 
                          color={isFocusedEmail ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={emailRef}
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
                          returnKeyType="next"
                          onSubmitEditing={() => focusNextField(phoneRef)}
                          blurOnSubmit={false}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Phone Input */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        isFocusedPhone && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => phoneRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="phone" 
                          size={22} 
                          color={isFocusedPhone ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={phoneRef}
                          style={styles.input}
                          placeholder="+383 XX XXX XXX"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="phone-pad"
                          value={phone}
                          onChangeText={handlePhoneChange}
                          onFocus={() => setIsFocusedPhone(true)}
                          onBlur={() => setIsFocusedPhone(false)}
                          maxLength={15}
                          returnKeyType="next"
                          onSubmitEditing={() => focusNextField(passwordRef)}
                          blurOnSubmit={false}
                        />
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.countryCodeText}>🇽🇰</Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Password Input */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        isFocusedPassword && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => passwordRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="lock" 
                          size={22} 
                          color={isFocusedPassword ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={passwordRef}
                          style={styles.input}
                          placeholder="Password"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry
                          value={password}
                          onChangeText={setPassword}
                          onFocus={() => setIsFocusedPassword(true)}
                          onBlur={() => setIsFocusedPassword(false)}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />
                        <TouchableOpacity 
                          style={styles.visibilityIcon}
                          onPress={() => {
                            // Toggle visibility logic here if needed
                          }}
                          activeOpacity={0.7}
                        >
                          <MaterialIcons name="visibility-off" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Forgot Password */}
                    <TouchableOpacity 
                      style={styles.forgotPassword}
                      onPress={() => Alert.alert("Forgot Password", "Please contact support.")}
                      activeOpacity={0.7}
                    >
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
                      <TouchableOpacity 
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Biometrics", "Biometric login coming soon.")}
                        activeOpacity={0.7}
                      >
                        <FontAwesome5 name="fingerprint" size={20} color="#007AFF" />
                        <Text style={styles.socialButtonText}>Use Biometrics</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.socialButton}
                        onPress={() => Alert.alert("Quick PIN", "PIN login coming soon.")}
                        activeOpacity={0.7}
                      >
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
                        activeOpacity={0.9}
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
    </View>
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
    paddingBottom: 40, // ✅ pak më shumë padding poshtë
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'flex-start', // ✅ FIX: mos krijo hapësirë të zezë poshtë
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
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
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  locationText: {
    color: '#00FF88',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 8,
  },
  formCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
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
  inputContainerTouchable: {
    marginBottom: 18,
    borderRadius: 16,
    overflow: 'hidden',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    paddingVertical: 0,
  },
  countryCodeBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  countryCodeText: {
    fontSize: 14,
  },
  visibilityIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
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
    shadowOffset: { width: 0, height: 6 },
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
    shadowOffset: { width: 0, height: 4 },
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
    marginTop: 28,      // ✅ kontrollon hapësirën, pa “black bar”
    paddingBottom: 10,  // ✅ pak breathing room
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

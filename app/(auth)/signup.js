import React, { useState, useRef } from 'react';
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
  const [emri, setEmri] = useState('');
  const [idLeternjoftimit, setIdLeternjoftimit] = useState('');
  const [telefoni, setTelefoni] = useState('+383');
  const [email, setEmail] = useState('');
  const [fjalekalimi, setFjalekalimi] = useState('');
  const [konfirmoFjalekalimin, setKonfirmoFjalekalimin] = useState('');
  
  const [fokusoEmri, setFokusoEmri] = useState(false);
  const [fokusoId, setFokusoId] = useState(false);
  const [fokusoTelefoni, setFokusoTelefoni] = useState(false);
  const [fokusoEmail, setFokusoEmail] = useState(false);
  const [fokusoFjalekalimi, setFokusoFjalekalimi] = useState(false);
  const [fokusoKonfirmimi, setFokusoKonfirmimi] = useState(false);
  
  const router = useRouter();

  // Refs për input fields
  const emriRef = useRef(null);
  const idRef = useRef(null);
  const telefoniRef = useRef(null);
  const emailRef = useRef(null);
  const fjalekalimiRef = useRef(null);
  const konfirmimiRef = useRef(null);

  // Validimi i ID-së së letërnjoftimit
  const validoIdLeternjoftimit = (id) => {
    // Format për ID-në: 10 karaktere (shifra dhe germa)
    const idRegex = /^[A-Za-z0-9]{10}$/;
    return idRegex.test(id);
  };

  // Validimi i numrit të telefonit Kosovar
  const validoNumrinTelefonit = (numri) => {
    const numriPastruar = numri.replace(/\s/g, '');
    
    if (!numriPastruar.startsWith('+383')) {
      return {
        eshteValide: false,
        mesazhi: 'Numri i telefonit duhet të fillojë me +383'
      };
    }

    if (numriPastruar.length !== 12) {
      return {
        eshteValide: false,
        mesazhi: 'Gjatësi e pavlefshme e numrit të telefonit'
      };
    }

    const kodiOperatorit = numriPastruar.substring(4, 6);
    const operatoretValide = ['44', '45', '46', '47', '48', '49', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69'];
    
    if (!operatoretValide.includes(kodiOperatorit)) {
      return {
        eshteValide: false,
        mesazhi: 'Kod i pavlefshëm i operatorit'
      };
    }

    return {
      eshteValide: true,
      numriFormatuar: formatNumrinTelefonit(numriPastruar)
    };
  };

  // Formatimi i numrit të telefonit
  const formatNumrinTelefonit = (numri) => {
    const numriPastruar = numri.replace(/\s/g, '');
    if (numriPastruar.startsWith('+383')) {
      const pjesaTjetër = numriPastruar.substring(4);
      return `+383 ${pjesaTjetër.substring(0, 2)} ${pjesaTjetër.substring(2, 5)} ${pjesaTjetër.substring(5)}`;
    }
    return numri;
  };

  // Handler për ndryshimin e numrit të telefonit
  const ndryshoTelefonin = (tekst) => {
    if (!tekst.startsWith('+383')) {
      setTelefoni('+383');
      return;
    }

    let tekstPastruar = tekst.replace(/[^\d+]/g, '');
    
    if (tekstPastruar.length > 12) {
      tekstPastruar = tekstPastruar.substring(0, 12);
    }

    if (tekstPastruar.length > 4) {
      const prefiksi = tekstPastruar.substring(0, 4);
      const pjesaTjetër = tekstPastruar.substring(4);
      
      let iFormatuar = prefiksi;
      if (pjesaTjetër.length > 0) {
        iFormatuar += ` ${pjesaTjetër.substring(0, 2)}`;
      }
      if (pjesaTjetër.length > 2) {
        iFormatuar += ` ${pjesaTjetër.substring(2, 5)}`;
      }
      if (pjesaTjetër.length > 5) {
        iFormatuar += ` ${pjesaTjetër.substring(5, 8)}`;
      }
      
      setTelefoni(iFormatuar);
    } else {
      setTelefoni(tekstPastruar);
    }
  };

  // Handler për ndryshimin e ID-së së letërnjoftimit
  const ndryshoIdLeternjoftimit = (tekst) => {
    // Konverto në uppercase dhe limito në 10 karaktere
    const tekstUppercase = tekst.toUpperCase().slice(0, 10);
    setIdLeternjoftimit(tekstUppercase);
  };

  // Funksion për të fokusuar në field-in tjetër
  const fokusoFushenTjetër = (refFusheTjetër) => {
    if (refFusheTjetër.current) {
      refFusheTjetër.current.focus();
    }
  };

  const regjistrohu = async () => {
    if (!emri || !idLeternjoftimit || !telefoni || !email || !fjalekalimi || !konfirmoFjalekalimin) {
      Alert.alert("Veprim i Nevojshëm", "Ju lutem plotësoni të gjitha fushat për të vazhduar.");
      return;
    }
    
    // Emri duhet të ketë së paku 2 fjalë (emër dhe mbiemër)
    const pjesëtEmrit = emri.trim().split(/\s+/);
    if (pjesëtEmrit.length < 2) {
      Alert.alert("Emër i Pavlefshëm", "Ju lutem shkruani emrin e plotë (emër dhe mbiemër).");
      return;
    }
    
    // Validimi i ID-së së letërnjoftimit
    if (!validoIdLeternjoftimit(idLeternjoftimit)) {
      Alert.alert("ID e Letërnjoftimit e Pavlefshme", "ID-ja e letërnjoftimit duhet të jetë saktësisht 10 karaktere (shkronja dhe numra).");
      return;
    }
    
    // Validimi i numrit të telefonit
    const validimiTelefonit = validoNumrinTelefonit(telefoni);
    if (!validimiTelefonit.eshteValide) {
      Alert.alert("Numër i Pavlefshëm i Telefonit", validimiTelefonit.mesazhi);
      return;
    }
    
    // Validimi i email-it
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Email i Pavlefshëm", "Ju lutem shkruani një adresë email të vlefshme.");
      return;
    }
    
    // Validimi i fjalëkalimit (minimum 10 karaktere)
    if (fjalekalimi.length < 10) {
      Alert.alert("Fjalëkalim i Dobët", "Fjalëkalimi duhet të ketë të paktën 10 karaktere.");
      return;
    }
    
    // Kërkesat për fjalëkalimin
    const kaShkronjaTëMëdha = /[A-Z]/.test(fjalekalimi);
    const kaShkronjaTëVogla = /[a-z]/.test(fjalekalimi);
    const kaNumra = /\d/.test(fjalekalimi);
    const kaKaraktereSpeciale = /[!@#$%^&*(),.?":{}|<>]/.test(fjalekalimi);
    
    if (!(kaShkronjaTëMëdha && kaShkronjaTëVogla && kaNumra && kaKaraktereSpeciale)) {
      Alert.alert(
        "Fjalëkalim i Dobët",
        "Fjalëkalimi duhet të përmbajë:\n• Shkronja të mëdha (A-Z)\n• Shkronja të vogla (a-z)\n• Numra (0-9)\n• Karaktere speciale (!@#$%...)"
      );
      return;
    }
    
    // Konfirmimi i fjalëkalimit
    if (fjalekalimi !== konfirmoFjalekalimin) {
      Alert.alert("Fjalëkalimet nuk Përputhen", "Fjalëkalimet nuk përputhen. Ju lutem provoni përsëri.");
      return;
    }
    
    // Procesi i regjistrimit
    Alert.alert(
      "Llogaria u Krijua!",
      "Llogaria juaj si Mbikëqyrës Urban është krijuar me sukses.\n\nKodi i verifikimit është dërguar në telefonin tuaj.",
      [
        {
          text: "Vazhdo",
          onPress: async () => {
            // Ruaj të dhënat e përdoruesit
            await AsyncStorage.setItem('userToken', 'user_logged_in');
            await AsyncStorage.setItem('userName', emri);
            await AsyncStorage.setItem('userPersonalId', idLeternjoftimit);
            await AsyncStorage.setItem('userPhone', validimiTelefonit.numriFormatuar);
            await AsyncStorage.setItem('userEmail', email);
            router.replace('/');
          }
        }
      ]
    );
  };

  const kthehuNeLogin = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000' }}
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
                      <MaterialIcons name="verified-user" size={42} color="#00d4ff" />
                    </View>
                    <View style={styles.logoTextContainer}>
                      <Text style={styles.logoText}>Verifiko</Text>
                      <Text style={styles.logoSubText}>Identitetin</Text>
                    </View>
                  </View>
                  <Text style={styles.welcomeText}>Bëhu një Mbikëqyrës Urban i Verifikuar</Text>
                  <Text style={styles.tagline}>I Sigurt • I Verifikuar </Text>
                </View>

                {/* Forma e Regjistrimit */}
                <View style={styles.formCard}>
                  <View style={styles.formCardInner}>
                    <Text style={styles.formTitle}>Verifikimi i Identitetit</Text>
                    <Text style={styles.formSubtitle}>Plotëso verifikimin për të pasur akses në të gjitha veçoritë</Text>
                    
                    {/* Fusha për Emrin e Plotë */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        fokusoEmri && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => emriRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="person" 
                          size={22} 
                          color={fokusoEmri ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={emriRef}
                          style={styles.input}
                          placeholder="Emri i Plotë (Emër & Mbiemër)"
                          placeholderTextColor="#9CA3AF"
                          autoCapitalize="words"
                          autoCorrect={false}
                          value={emri}
                          onChangeText={setEmri}
                          onFocus={() => setFokusoEmri(true)}
                          onBlur={() => setFokusoEmri(false)}
                          returnKeyType="next"
                          onSubmitEditing={() => fokusoFushenTjetër(idRef)}
                          blurOnSubmit={false}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Fusha për ID e Letërnjoftimit */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        fokusoId && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => idRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="badge" 
                          size={22} 
                          color={fokusoId ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={idRef}
                          style={styles.input}
                          placeholder="ID e Letërnjoftimit (10 karaktere)"
                          placeholderTextColor="#9CA3AF"
                          autoCapitalize="characters"
                          autoCorrect={false}
                          value={idLeternjoftimit}
                          onChangeText={ndryshoIdLeternjoftimit}
                          onFocus={() => setFokusoId(true)}
                          onBlur={() => setFokusoId(false)}
                          maxLength={10}
                          returnKeyType="next"
                          onSubmitEditing={() => fokusoFushenTjetër(telefoniRef)}
                          blurOnSubmit={false}
                        />
                        <View style={styles.charCounter}>
                          <Text style={styles.charCounterText}>{idLeternjoftimit.length}/10</Text>
                        </View>
                      </View>
                      <Text style={styles.fieldHint}>Numri i letërnjoftimit / pasaportës</Text>
                    </TouchableOpacity>

                    {/* Fusha për Telefonin */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        fokusoTelefoni && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => telefoniRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="phone" 
                          size={22} 
                          color={fokusoTelefoni ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={telefoniRef}
                          style={styles.input}
                          placeholder="+383 XX XXX XXX"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="phone-pad"
                          value={telefoni}
                          onChangeText={ndryshoTelefonin}
                          onFocus={() => setFokusoTelefoni(true)}
                          onBlur={() => setFokusoTelefoni(false)}
                          maxLength={15}
                          returnKeyType="next"
                          onSubmitEditing={() => fokusoFushenTjetër(emailRef)}
                          blurOnSubmit={false}
                        />
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.countryCodeText}>🇽🇰</Text>
                        </View>
                      </View>
                      <Text style={styles.fieldHint}>Përdoret për verifikim dhe përditësime</Text>
                    </TouchableOpacity>

                    {/* Fusha për Email */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        fokusoEmail && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => emailRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="email" 
                          size={22} 
                          color={fokusoEmail ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={emailRef}
                          style={styles.input}
                          placeholder="Adresa Email"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={email}
                          onChangeText={setEmail}
                          onFocus={() => setFokusoEmail(true)}
                          onBlur={() => setFokusoEmail(false)}
                          returnKeyType="next"
                          onSubmitEditing={() => fokusoFushenTjetër(fjalekalimiRef)}
                          blurOnSubmit={false}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Fusha për Fjalëkalimin */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        fokusoFjalekalimi && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => fjalekalimiRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="lock" 
                          size={22} 
                          color={fokusoFjalekalimi ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={fjalekalimiRef}
                          style={styles.input}
                          placeholder="Fjalëkalimi (min. 10 karaktere)"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry
                          value={fjalekalimi}
                          onChangeText={setFjalekalimi}
                          onFocus={() => setFokusoFjalekalimi(true)}
                          onBlur={() => setFokusoFjalekalimi(false)}
                          returnKeyType="next"
                          onSubmitEditing={() => fokusoFushenTjetër(konfirmimiRef)}
                          blurOnSubmit={false}
                        />
                        <TouchableOpacity style={styles.visibilityIcon}>
                          <MaterialIcons name="visibility-off" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Fusha për Konfirmimin e Fjalëkalimit */}
                    <TouchableOpacity
                      style={[
                        styles.inputContainerTouchable,
                        fokusoKonfirmimi && styles.inputContainerFocused
                      ]}
                      activeOpacity={1}
                      onPress={() => konfirmimiRef.current?.focus()}
                    >
                      <View style={styles.inputContainer}>
                        <MaterialIcons 
                          name="lock-outline" 
                          size={22} 
                          color={fokusoKonfirmimi ? '#007AFF' : '#6B7280'} 
                          style={styles.inputIcon}
                        />
                        <TextInput
                          ref={konfirmimiRef}
                          style={styles.input}
                          placeholder="Konfirmo Fjalëkalimin"
                          placeholderTextColor="#9CA3AF"
                          secureTextEntry
                          value={konfirmoFjalekalimin}
                          onChangeText={setKonfirmoFjalekalimin}
                          onFocus={() => setFokusoKonfirmimi(true)}
                          onBlur={() => setFokusoKonfirmimi(false)}
                          returnKeyType="done"
                          onSubmitEditing={regjistrohu}
                        />
                        <TouchableOpacity style={styles.visibilityIcon}>
                          <MaterialIcons name="visibility-off" size={20} color="#6B7280" />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Kërkesat për Fjalëkalimin */}
                    <View style={styles.passwordRequirements}>
                      <Text style={styles.requirementsTitle}>Kërkesat për Fjalëkalimin (min. 10 karaktere):</Text>
                      
                      <View style={styles.requirementRow}>
                        <View style={styles.requirementItem}>
                          <MaterialIcons 
                            name={fjalekalimi.length >= 10 ? "check-circle" : "error"} 
                            size={16} 
                            color={fjalekalimi.length >= 10 ? '#10B981' : '#EF4444'} 
                          />
                          <Text style={[
                            styles.requirementText,
                            fjalekalimi.length >= 10 ? styles.requirementTextMet : styles.requirementTextNotMet
                          ]}>
                            Të paktën 10 karaktere
                          </Text>
                        </View>
                        <Text style={styles.charCount}>{fjalekalimi.length}/10</Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <MaterialIcons 
                          name={/[A-Z]/.test(fjalekalimi) ? "check-circle" : "error"} 
                          size={16} 
                          color={/[A-Z]/.test(fjalekalimi) ? '#10B981' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.requirementText,
                          /[A-Z]/.test(fjalekalimi) ? styles.requirementTextMet : styles.requirementTextNotMet
                        ]}>
                          Shkronja të mëdha (A-Z)
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <MaterialIcons 
                          name={/[a-z]/.test(fjalekalimi) ? "check-circle" : "error"} 
                          size={16} 
                          color={/[a-z]/.test(fjalekalimi) ? '#10B981' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.requirementText,
                          /[a-z]/.test(fjalekalimi) ? styles.requirementTextMet : styles.requirementTextNotMet
                        ]}>
                          Shkronja të vogla (a-z)
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <MaterialIcons 
                          name={/\d/.test(fjalekalimi) ? "check-circle" : "error"} 
                          size={16} 
                          color={/\d/.test(fjalekalimi) ? '#10B981' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.requirementText,
                          /\d/.test(fjalekalimi) ? styles.requirementTextMet : styles.requirementTextNotMet
                        ]}>
                          Numra (0-9)
                        </Text>
                      </View>
                      
                      <View style={styles.requirementItem}>
                        <MaterialIcons 
                          name={/[!@#$%^&*(),.?":{}|<>]/.test(fjalekalimi) ? "check-circle" : "error"} 
                          size={16} 
                          color={/[!@#$%^&*(),.?":{}|<>]/.test(fjalekalimi) ? '#10B981' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.requirementText,
                          /[!@#$%^&*(),.?":{}|<>]/.test(fjalekalimi) ? styles.requirementTextMet : styles.requirementTextNotMet
                        ]}>
                          Karaktere speciale (!@#$...)
                        </Text>
                      </View>
                    </View>

                    {/* Kushtet dhe Privatësia */}
                    <View style={styles.termsContainer}>
                      <MaterialIcons name="verified" size={18} color="#10B981" />
                      <Text style={styles.termsText}>
                        Informacioni juaj është i koduar dhe përdoret vetëm për qëllime verifikimi. 
                        Duke u regjistruar, ju pranoni{' '}
                        <Text style={styles.termsLink}>Kushtet e Shërbimit</Text> dhe{' '}
                        <Text style={styles.termsLink}>Politikën e Privatësisë</Text> tonë.
                      </Text>
                    </View>

                    {/* Butoni i Regjistrimit */}
                    <TouchableOpacity 
                      style={[
                        styles.signUpButton,
                        (!emri || !idLeternjoftimit || !telefoni || !email || !fjalekalimi || !konfirmoFjalekalimin) && styles.signUpButtonDisabled
                      ]} 
                      onPress={regjistrohu}
                      activeOpacity={0.9}
                      disabled={!emri || !idLeternjoftimit || !telefoni || !email || !fjalekalimi || !konfirmoFjalekalimin}
                    >
                      <View style={styles.buttonGradient}>
                        <MaterialIcons name="how-to-reg" size={22} color="#FFFFFF" />
                        <Text style={styles.signUpButtonText}>Plotëso Verifikimin</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                      <Text style={styles.dividerText}>OSE REGJISTROHUNI ME</Text>
                      <View style={styles.divider} />
                    </View>

                    {/* Opsionet e Regjistrimit Social */}
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

                    {/* Seksioni i Login */}
                    <View style={styles.loginContainer}>
                      <Text style={styles.loginText}>Jeni tashmë një Mbikëqyrës Urban i Verifikuar?</Text>
                      <TouchableOpacity 
                        style={styles.loginButton}
                        onPress={kthehuNeLogin}
                        activeOpacity={0.7}
                      >
                        <View style={styles.loginButtonInner}>
                          <Text style={styles.loginButtonText}>Hyni në Llogari</Text>
                          <MaterialIcons name="arrow-forward" size={18} color="#007AFF" />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  
                  <View style={styles.securityBadge}>
                    <MaterialIcons name="verified-user" size={16} color="#00FF88" />
                    <Text style={styles.securityText}>Verifikim me Standard Qeveritar</Text>
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

// Stilet mbeten të njëjta, vetëm i kam përkthyer komentet
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
    paddingBottom: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
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
    textAlign: 'center',
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
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputContainerTouchable: {
    marginBottom: 24,
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
  charCounter: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  charCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
  fieldHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    marginLeft: 4,
    fontStyle: 'italic',
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
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 13,
    marginLeft: 8,
  },
  requirementTextMet: {
    color: '#10B981',
    fontWeight: '600',
  },
  requirementTextNotMet: {
    color: '#6B7280',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
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
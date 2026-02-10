import React, {useMemo, useState} from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {useOnboardingStore} from '../store/onboardingStore';

export const LoginScreen = (): React.JSX.Element => {
  const login = useOnboardingStore(state => state.login);

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const disabled = useMemo(
    () => account.trim().length === 0 || password.trim().length === 0,
    [account, password],
  );

  const onLogin = () => {
    if (disabled) {
      return;
    }
    login(account.trim());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.brandBlock}>
          <Text style={styles.logo}>FitRest</Text>
          <View style={styles.sloganRow}>
            <View style={styles.sloganLine} />
            <Text style={styles.sloganText}>极简健身助手</Text>
          </View>
        </View>

        <View style={styles.form}>
          <TextInput
            value={account}
            onChangeText={setAccount}
            style={styles.input}
            placeholder="手机号 / 邮箱"
            placeholderTextColor="#9DA4B0"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="密码"
            placeholderTextColor="#9DA4B0"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <View style={styles.optionRow}>
            <Pressable style={styles.rememberWrap} onPress={() => setRememberMe(prev => !prev)}>
              <View style={[styles.checkBox, rememberMe && styles.checkBoxActive]}>
                {rememberMe ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.optionText}>记住我</Text>
            </Pressable>

            <Pressable>
              <Text style={styles.optionText}>忘记密码?</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onLogin}
            style={[styles.loginButton, disabled && styles.loginButtonDisabled]}
            disabled={disabled}>
            <Text style={styles.loginButtonText}>进入应用  →</Text>
          </Pressable>
        </View>

        <View style={styles.socialBlock}>
          <View style={styles.thirdTitleRow}>
            <View style={styles.thirdLine} />
            <Text style={styles.thirdTitle}>第三方登录</Text>
            <View style={styles.thirdLine} />
          </View>

          <View style={styles.socialButtons}>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialIcon}>微</Text>
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialIcon}></Text>
            </Pressable>
            <Pressable style={styles.socialButton}>
              <Text style={styles.socialIcon}>···</Text>
            </Pressable>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>还没有账号?</Text>
            <Pressable>
              <Text style={styles.registerLink}> 立即注册</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.homeIndicator} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
    paddingHorizontal: 28,
  },
  brandBlock: {
    marginTop: 74,
  },
  logo: {
    fontSize: 56,
    fontWeight: '900',
    color: '#030303',
    fontStyle: 'italic',
    letterSpacing: -1.6,
  },
  sloganRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sloganLine: {
    width: 48,
    height: 1.5,
    backgroundColor: '#151515',
  },
  sloganText: {
    color: '#9EA4AF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.9,
  },
  form: {
    marginTop: 56,
    gap: 14,
  },
  input: {
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D7DBE2',
    color: '#101010',
    fontSize: 16,
    paddingHorizontal: 18,
    backgroundColor: '#F5F6F8',
  },
  optionRow: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#C7CDD7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#F5F6F8',
  },
  checkBoxActive: {
    backgroundColor: '#0A0A0A',
    borderColor: '#0A0A0A',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  optionText: {
    color: '#8E95A3',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 24,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.45,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  socialBlock: {
    marginTop: 'auto',
    paddingBottom: 26,
  },
  thirdTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    gap: 14,
  },
  thirdLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E3E6ED',
  },
  thirdTitle: {
    color: '#CBD1DB',
    fontSize: 13,
    fontWeight: '600',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#D7DBE2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
  },
  socialIcon: {
    color: '#1A2437',
    fontSize: 17,
    fontWeight: '700',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    color: '#6E7787',
    fontSize: 14,
    fontWeight: '500',
  },
  registerLink: {
    color: '#151515',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  homeIndicator: {
    alignSelf: 'center',
    width: 130,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
});

import { Toggle } from '@/components/ui/Toggle';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    avatar: user?.avatar || '',
  });

  // Notification toggles
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    schedule: true,
  });

  // Dark mode (placeholder - would connect to theme provider)
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English (US)');

  const languages = [
    { code: 'en', name: 'English (US)', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
  ];

  const handleEditProfile = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      avatar: user?.avatar || '',
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    // TODO: Update user in store
    console.log('Saving profile:', formData);
    setIsEditModalVisible(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData(prev => ({ ...prev, avatar: result.assets[0].uri }));
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLanguageSelect = (langName: string) => {
    setCurrentLanguage(langName);
    setIsLanguageModalVisible(false);
    Alert.alert('Language Changed', `Language set to ${langName}`);
  };

  const getInitials = () => {
    return user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your account and preferences</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            {user?.avatar || formData.avatar ? (
              <Image source={{ uri: user?.avatar || formData.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{user?.name}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profileDepartment}>
                {user?.department} • Staff Member
              </Text>
            </View>
          </View>
          <Pressable onPress={handleEditProfile} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>
          <View style={styles.sectionContent}>
            {[
              {
                icon: 'person-outline',
                label: 'Profile Information',
                sub: 'Update your personal details',
                onPress: handleEditProfile,
              },
              {
                icon: 'lock-closed-outline',
                label: 'Change Password',
                sub: 'Update your security credentials',
                onPress: () => Alert.alert('Coming Soon', 'Password change feature'),
              },
              {
                icon: 'phone-portrait-outline',
                label: 'Connected Devices',
                sub: 'Manage logged-in devices',
                onPress: () => Alert.alert('Coming Soon', 'Device management feature'),
              },
            ].map((item, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.settingItem,
                  idx !== 2 && styles.settingItemBorder,
                ]}
                onPress={item.onPress}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingSub}>{item.sub}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>
          <View style={styles.sectionContent}>
            {[
              {
                id: 'push',
                icon: 'notifications-outline',
                label: 'Push Notifications',
                sub: 'Receive alerts on your device',
              },
              {
                id: 'email',
                icon: 'mail-outline',
                label: 'Email Notifications',
                sub: 'Get updates via email',
              },
              {
                id: 'schedule',
                icon: 'time-outline',
                label: 'Schedule Alerts',
                sub: 'Class start/end reminders',
              },
            ].map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.settingItem,
                  idx !== 2 && styles.settingItemBorder,
                ]}
              >
                <View style={styles.settingItemLeft}>
                  <View style={styles.settingIcon}>
                    <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                  </View>
                  <View>
                    <Text style={styles.settingLabel}>{item.label}</Text>
                    <Text style={styles.settingSub}>{item.sub}</Text>
                  </View>
                </View>
                <Toggle
                  value={notifications[item.id as keyof typeof notifications]}
                  onValueChange={() => toggleNotification(item.id as keyof typeof notifications)}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <View style={styles.settingItemLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="moon-outline" size={20} color="#6B7280" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingSub}>Toggle dark theme</Text>
                </View>
              </View>
              <Toggle value={isDarkMode} onValueChange={setIsDarkMode} />
            </View>

            <Pressable
              style={styles.settingItem}
              onPress={() => setIsLanguageModalVisible(true)}
            >
              <View style={styles.settingItemLeft}>
                <View style={styles.settingIcon}>
                  <Ionicons name="globe-outline" size={20} color="#6B7280" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Language</Text>
                  <Text style={styles.settingSub}>{currentLanguage}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </Pressable>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <Pressable onPress={() => setIsEditModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Avatar Upload */}
              <View style={styles.avatarSection}>
                <Pressable onPress={handlePickImage} style={styles.avatarUpload}>
                  {formData.avatar ? (
                    <Image source={{ uri: formData.avatar }} style={styles.avatarLarge} />
                  ) : (
                    <View style={styles.avatarLargePlaceholder}>
                      <Text style={styles.avatarLargeText}>{getInitials()}</Text>
                    </View>
                  )}
                  <View style={styles.cameraButton}>
                    <Ionicons name="camera" size={16} color="white" />
                  </View>
                </Pressable>
                <Text style={styles.avatarHint}>Click to change photo</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={[styles.formInput, styles.formInputDisabled]}
                  value={formData.email}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Department</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.department}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, department: text }))}
                  placeholder="e.g. Science Department"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalButtonTextPrimary}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <Pressable onPress={() => setIsLanguageModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView style={styles.languageList}>
              {languages.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    currentLanguage === lang.name && styles.languageItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.name)}
                >
                  <View>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    <Text style={styles.languageNative}>{lang.native}</Text>
                  </View>
                  {currentLanguage === lang.name && (
                    <Ionicons name="checkmark" size={20} color="#2563EB" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  profileCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profileDepartment: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sectionContent: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarUpload: {
    position: 'relative',
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: '#BFDBFE',
  },
  avatarLargePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#BFDBFE',
  },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2563EB',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: 'white',
  },
  formInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#F3F4F6',
  },
  modalButtonPrimary: {
    backgroundColor: '#2563EB',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  languageList: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageItemActive: {
    backgroundColor: '#EFF6FF',
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 12,
    color: '#6B7280',
  },
});
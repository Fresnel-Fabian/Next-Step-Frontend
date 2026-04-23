jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props: any) =>
    React.createElement(View, { testID: `icon-${props.name}`, ...props });
  return new Proxy(
    { Ionicons: Icon },
    {
      get: (target: any, prop: string) => target[prop] ?? Icon,
    },
  );
});

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
  dismissAuthSession: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'http://localhost/redirect'),
  useAuthRequest: () => [null, null, jest.fn()],
  ResponseType: { Code: 'code' },
  CodeChallengeMethod: { S256: 'S256' },
}));

jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn(async () => 'digest'),
  CryptoDigestAlgorithm: { SHA256: 'SHA256' },
  CryptoEncoding: { BASE64: 'base64' },
}));

jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: (props: any) => React.createElement(View, props, props.children),
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Tabs: Object.assign(
      (props: any) => React.createElement(View, { testID: 'tabs' }, props.children),
      {
        Screen: (props: any) =>
          React.createElement(View, { testID: `tab-${props.name}` }),
      },
    ),
    Stack: Object.assign(
      (props: any) => React.createElement(View, null, props.children),
      { Screen: (props: any) => React.createElement(View, props) },
    ),
    Redirect: ({ href }: { href: string }) =>
      React.createElement(View, { testID: `redirect-${href}` }),
    Link: (props: any) => React.createElement(View, props, props.children),
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      navigate: jest.fn(),
    }),
    useSegments: () => [],
    usePathname: () => '/',
    useLocalSearchParams: () => ({}),
    useFocusEffect: jest.fn(),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const inset = { top: 0, bottom: 0, left: 0, right: 0 };
  return {
    SafeAreaProvider: ({ children }: any) => React.createElement(View, null, children),
    SafeAreaView: ({ children }: any) => React.createElement(View, null, children),
    useSafeAreaInsets: () => inset,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Silence the __DEV__ console.log chatter from services/api.ts
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0] : '';
  if (/^(🚀|✅|❌)/.test(first)) return;
  originalLog(...args);
};

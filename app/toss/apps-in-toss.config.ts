// 앱인토스 설정 — appName 은 앱인토스 콘솔에 등록한 앱 이름과 똑같아야 업로드된다.
import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'jellypop',
  brand: { primaryColor: '#FF5F8A' },
  permissions: [],
  webView: {
    allowsInlineMediaPlayback: true,
    mediaPlaybackRequiresUserAction: false,
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: 'never',
    allowsBackForwardNavigationGestures: false,
  },
  webBundleDir: 'dist',
});

import { webview } from '@kit.ArkWeb';

@Entry
@Component
struct ReactApp {
  controller: webview.WebviewController = new webview.WebviewController();

  build() {
    Column() {
      Web({ src: $rawfile('www/index.html'), controller: this.controller })
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .fileAccess(true)
        .imageAccess(true)
        .onlineImageAccess(true)
        .geolocationAccess(true)
        .mixedMode(MixedMode.All)
        .width('100%')
        .height('100%')
        .onGeolocationShow((event) => {
          if (event) {
            event.geolocation.invoke(event.origin, true, false);
          }
        })
    }
    .width('100%')
    .height('100%')
  }
}

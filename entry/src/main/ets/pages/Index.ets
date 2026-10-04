import { webview } from '@kit.ArkWeb';

@Entry
@Component
struct Index {
  controller: webview.WebviewController = new webview.WebviewController();
  @State showReact: boolean = false;

  aboutToAppear(): void {
    try {
      this.showReact = this.getUIContext().getHostContext() !== undefined;
    } catch (err) {
      this.showReact = false;
    }
  }

  @Builder
  previewNotice() {
    Column({ space: 16 }) {
      Text('Kraków bez barier')
        .fontSize(28)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFFFFF')
      Text('Podgląd DevEco nie rysuje komponentu Web, w którym działa React. Szary napis „Preview is not available” nie oznacza, że aplikacja jest zepsuta.')
        .fontSize(16)
        .fontColor('#FFFFFF')
      Text('Uruchom moduł entry na emulatorze albo telefonie. Tam ładuje się wyeksportowany interfejs.')
        .fontSize(16)
        .fontColor('#FFFFFF')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .alignItems(HorizontalAlign.Start)
    .padding(24)
    .backgroundColor('#208AEF')
  }

  build() {
    if (this.showReact) {
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
    } else {
      this.previewNotice()
    }
  }
}

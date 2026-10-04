import { router } from '@kit.ArkUI';
import { deviceInfo } from '@kit.BasicServicesKit';

@Entry
@Component
struct Index {
  @State status: string = 'Ładowanie aplikacji…';

  aboutToAppear(): void {
    const model = deviceInfo.productModel ?? '';
    const preview = model.length === 0 || model.toLowerCase().includes('preview');
    if (preview) {
      this.status = 'Podgląd ArkUI jest gotowy. React otwiera się na emulatorze.';
      return;
    }
    router.replaceUrl({ url: 'pages/ReactApp' }).catch(() => {
      this.status = 'Nie udało się otworzyć interfejsu React.';
    });
  }

  build() {
    Column({ space: 12 }) {
      Text('Kraków bez barier')
        .fontSize(32)
        .fontWeight(FontWeight.Bold)
        .fontColor('#FFFFFF')
      Text(this.status)
        .fontSize(16)
        .fontColor('#FFFFFF')
        .width('100%')
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .padding(24)
    .backgroundColor('#208AEF')
  }
}
